const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Event = require('../models/Event');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's stats
    const todayDonations = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const todayExpenses = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly stats
    const monthlyDonations = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const monthlyExpenses = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Inventory stats
    const inventoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' }
        }
      }
    ]);

    // Expiring items (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const expiringItems = await Inventory.countDocuments({
      status: 'available',
      expiryDate: { $lte: nextWeek, $gte: today }
    });

    // Recent activities (last 10 items)
    const recentDonations = await Donation.find()
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentExpenses = await Expense.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Upcoming events
    const upcomingEvents = await Event.find({
      date: { $gte: today },
      status: { $in: ['upcoming', 'ongoing'] }
    })
    .sort({ date: 1 })
    .limit(5);

    // Calculate totals
    const todayTotalDonations = todayDonations.reduce((sum, d) => sum + d.amount, 0);
    const todayTotalExpenses = todayExpenses[0]?.amount || 0;
    const monthlyTotalDonations = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
    const monthlyTotalExpenses = monthlyExpenses[0]?.amount || 0;

    // Get trend data for last 6 months from database
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendData = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          income: { $sum: { $ifNull: ['$amount', 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          period: {
            $dateToString: {
              format: '%b',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          income: 1,
          _id: 0
        }
      }
    ]);

    // Get expense trend data for same period
    const expenseTrendData = await Expense.aggregate([
      {
        $match: {
          billDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' }
          },
          expenses: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Merge income and expense trend data
    const combinedTrendData = trendData.map(income => {
      const expense = expenseTrendData.find(exp => 
        exp._id.year === income._id?.year && exp._id.month === income._id?.month
      );
      return {
        period: income.period,
        income: income.income || 0,
        expenses: expense?.expenses || 0
      };
    });

    // Get category breakdown from donations
    const categoryData = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$event',
          value: { $sum: { $ifNull: ['$amount', 0] } }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'general'] }, then: 'General Donations' },
                { case: { $in: ['$_id', ['festival-expenses', 'festival']] }, then: 'Festival Donations' },
                { case: { $eq: ['$_id', 'anadhanam'] }, then: 'Anadhanam' },
                { case: { $in: ['$_id', ['guru-poojai', 'pradosham']] }, then: 'Puja Offerings' }
              ],
              default: 'Other'
            }
          },
          value: 1,
          _id: 0
        }
      },
      { $match: { value: { $gt: 0 } } }
    ]);

    // Get top donors from database
    const topDonors = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$donor.name',
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          donationCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          totalAmount: 1,
          donationCount: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    // Monthly data is same as trend data
    const monthlyData = combinedTrendData;

    res.status(200).json({
      success: true,
      data: {
        // Summary metrics for cards
        totalIncome: monthlyTotalDonations,
        totalExpenses: monthlyTotalExpenses,
        netBalance: monthlyTotalDonations - monthlyTotalExpenses,
        cashOnHand: monthlyTotalDonations - monthlyTotalExpenses, // Simplified calculation
        
        // Chart data from database
        trendData: combinedTrendData,
        categoryData: categoryData.length > 0 ? categoryData : [{ name: 'No data', value: 0 }],
        monthlyData,
        topDonors,
        
        // Calculate metrics from database data
        metrics: {
          avgDonation: monthlyDonations.length > 0 ? Math.round(monthlyTotalDonations / monthlyDonations.reduce((sum, d) => sum + d.count, 0)) : 0,
          totalDonors: topDonors.length,
          avgExpense: monthlyExpenses.length > 0 && monthlyExpenses[0].count > 0 ? Math.round(monthlyTotalExpenses / monthlyExpenses[0].count) : 0,
          expenseCategories: (await Expense.distinct('category')).length || 0
        },
        
        // Legacy data structure
        today: {
          donations: {
            data: todayDonations,
            total: todayTotalDonations,
            count: todayDonations.reduce((sum, d) => sum + d.count, 0)
          },
          expenses: {
            total: todayTotalExpenses,
            count: todayExpenses[0]?.count || 0
          },
          netBalance: todayTotalDonations - todayTotalExpenses
        },
        monthly: {
          donations: {
            data: monthlyDonations,
            total: monthlyTotalDonations,
            count: monthlyDonations.reduce((sum, d) => sum + d.count, 0)
          },
          expenses: {
            total: monthlyTotalExpenses,
            count: monthlyExpenses[0]?.count || 0
          },
          netBalance: monthlyTotalDonations - monthlyTotalExpenses
        },
        inventory: {
          stats: inventoryStats,
          expiringItems,
          total: inventoryStats.reduce((sum, s) => sum + s.count, 0)
        },
        recent: {
          donations: recentDonations,
          expenses: recentExpenses
        },
        upcomingEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get income report
// @route   GET /api/reports/income
// @access  Private
const getIncomeReport = async (req, res, next) => {
  try {
    const { startDate, endDate, event, type } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }
    if (event) matchCriteria.event = event;
    if (type) matchCriteria.type = type;

    // Aggregate donations
    const incomeByType = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const incomeByEvent = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const incomeByDate = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get detailed donations list
    const donations = await Donation.find(matchCriteria)
      .populate('receivedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalAmount = incomeByType.reduce((sum, income) => sum + income.amount, 0);
    const totalCount = incomeByType.reduce((sum, income) => sum + income.count, 0);

    // Get trend data for last 12 months from database
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const trendData = await Donation.aggregate([
      {
        $match: {
          ...matchCriteria,
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          amount: { $sum: { $ifNull: ['$amount', 0] } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          period: {
            $dateToString: {
              format: '%b',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          amount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get category data from database
    const categoryData = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$event',
          value: { $sum: { $ifNull: ['$amount', 0] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'general'] }, then: 'General Donation' },
                { case: { $in: ['$_id', ['guru-poojai', 'pradosham']] }, then: 'Pooja Offerings' },
                { case: { $in: ['$_id', ['festival', 'festival-expenses']] }, then: 'Festival Donations' },
                { case: { $eq: ['$_id', 'anadhanam'] }, then: 'Anadhanam' }
              ],
              default: 'Other'
            }
          },
          value: 1,
          count: 1,
          _id: 0
        }
      },
      { $match: { value: { $gt: 0 } } }
    ]);

    // Get payment method data from database
    const paymentMethodData = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$type',
          amount: { $sum: { $ifNull: ['$amount', 0] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          method: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'cash'] }, then: 'Cash' },
                { case: { $eq: ['$_id', 'upi'] }, then: 'UPI' },
                { case: { $eq: ['$_id', 'bank-transfer'] }, then: 'Bank Transfer' }
              ],
              default: 'Other'
            }
          },
          amount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get top donors from database
    const topDonors = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            name: '$donor.name',
            phone: '$donor.mobile'
          },
          totalDonated: { $sum: { $ifNull: ['$amount', 0] } },
          donationCount: { $sum: 1 },
          firstDonation: { $min: '$createdAt' },
          lastDonation: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          name: '$_id.name',
          phone: '$_id.phone',
          totalDonated: 1,
          donationCount: 1,
          avgDonation: { $divide: ['$totalDonated', '$donationCount'] },
          firstDonation: 1,
          lastDonation: 1,
          _id: 0
        }
      },
      { $sort: { totalDonated: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        // Summary metrics
        totalAmount,
        totalCount,
        averageAmount: totalCount > 0 ? Math.round(totalAmount / totalCount) : 0,
        uniqueDonors: topDonors.length,
        
        // Chart data
        trendData,
        categoryData,
        paymentMethodData,
        topDonors,
        
        // Legacy structure
        summary: {
          totalAmount,
          totalCount,
          byType: incomeByType,
          byEvent: incomeByEvent,
          byDate: incomeByDate
        },
        donations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense report
// @route   GET /api/reports/expense
// @access  Private
const getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, category, status } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.billDate = {};
      if (startDate) matchCriteria.billDate.$gte = new Date(startDate);
      if (endDate) matchCriteria.billDate.$lte = new Date(endDate);
    }
    if (category) matchCriteria.category = category;
    if (status) matchCriteria.status = status;

    // Aggregate expenses
    const expensesByCategory = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const expensesByStatus = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const expensesByDate = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get detailed expenses list
    const expenses = await Expense.find(matchCriteria)
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalAmount = expensesByCategory.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = expensesByCategory.reduce((sum, expense) => sum + expense.count, 0);

    // Get trend data for last 12 months from database
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const trendData = await Expense.aggregate([
      {
        $match: {
          ...matchCriteria,
          billDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          period: {
            $dateToString: {
              format: '%b',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          amount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get category data from database
    const categoryData = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'cooking-gas-fuel'] }, then: 'Cooking Gas & Fuel' },
                { case: { $eq: ['$_id', 'labor-charges'] }, then: 'Labor Charges' },
                { case: { $eq: ['$_id', 'electricity-bill'] }, then: 'Electricity Bill' },
                { case: { $eq: ['$_id', 'maintenance'] }, then: 'Maintenance' },
                { case: { $eq: ['$_id', 'festival-expenses'] }, then: 'Festival Expenses' },
                { case: { $eq: ['$_id', 'anadhanam-supplies'] }, then: 'Anadhanam Supplies' }
              ],
              default: 'Other'
            }
          },
          value: 1,
          _id: 0
        }
      },
      { $match: { value: { $gt: 0 } } }
    ]);

    // Get status data from database
    const statusData = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          status: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'paid'] }, then: 'Paid' },
                { case: { $eq: ['$_id', 'pending'] }, then: 'Pending' },
                { case: { $eq: ['$_id', 'approved'] }, then: 'Approved' },
                { case: { $eq: ['$_id', 'rejected'] }, then: 'Rejected' }
              ],
              default: 'Other'
            }
          },
          amount: 1,
          _id: 0
        }
      }
    ]);

    // Get payment method data from database
    const paymentMethodData = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          method: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'cash'] }, then: 'Cash' },
                { case: { $eq: ['$_id', 'bank-transfer'] }, then: 'Bank Transfer' },
                { case: { $eq: ['$_id', 'upi'] }, then: 'UPI' },
                { case: { $eq: ['$_id', 'cheque'] }, then: 'Cheque' }
              ],
              default: 'Other'
            }
          },
          amount: 1,
          _id: 0
        }
      }
    ]);

    // Get top vendors from database
    const topVendors = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            name: '$vendor.name',
            contact: '$vendor.contact'
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: '$billDate' }
        }
      },
      {
        $project: {
          name: '$_id.name',
          contact: '$_id.contact',
          totalAmount: 1,
          transactionCount: 1,
          lastTransaction: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    // Get recent expenses from database
    const recentExpenses = await Expense.find(matchCriteria)
      .populate('createdBy', 'name')
      .sort({ billDate: -1 })
      .limit(5)
      .select('description vendor amount status billDate category');

    res.status(200).json({
      success: true,
      data: {
        // Summary metrics
        totalAmount,
        totalCount,
        averageAmount: totalCount > 0 ? Math.round(totalAmount / totalCount) : 0,
        uniqueVendors: topVendors.length,
        
        // Chart data
        trendData,
        categoryData,
        statusData,
        paymentMethodData,
        topVendors,
        recentExpenses,
        
        // Legacy structure
        summary: {
          totalAmount,
          totalCount,
          byCategory: expensesByCategory,
          byStatus: expensesByStatus,
          byDate: expensesByDate
        },
        expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get balance sheet
// @route   GET /api/reports/balance
// @access  Private
const getBalanceSheet = async (req, res, next) => {
  try {
    const { startDate, endDate, event } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }
    if (event) matchCriteria.event = event;

    // Get income (donations)
    const income = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalCash: {
            $sum: {
              $cond: [{ $eq: ['$type', 'cash'] }, '$amount', 0]
            }
          },
          totalUpi: {
            $sum: {
              $cond: [{ $eq: ['$type', 'upi'] }, '$amount', 0]
            }
          },
          inKindCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'in-kind'] }, 1, 0]
            }
          },
          totalDonations: { $sum: 1 }
        }
      }
    ]);

    // Get expenses
    const expenseMatchCriteria = { ...matchCriteria };
    if (expenseMatchCriteria.createdAt) {
      expenseMatchCriteria.billDate = expenseMatchCriteria.createdAt;
      delete expenseMatchCriteria.createdAt;
    }

    const expenses = await Expense.aggregate([
      { $match: expenseMatchCriteria },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          approvedExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          },
          pendingExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const incomeData = income[0] || {
      totalCash: 0,
      totalUpi: 0,
      inKindCount: 0,
      totalDonations: 0
    };

    const expenseData = expenses[0] || {
      totalExpenses: 0,
      approvedExpenses: 0,
      pendingExpenses: 0,
      totalCount: 0
    };

    const totalIncome = incomeData.totalCash + incomeData.totalUpi;
    const netBalance = totalIncome - expenseData.approvedExpenses;
    const projectedBalance = totalIncome - expenseData.totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        income: {
          cash: incomeData.totalCash,
          upi: incomeData.totalUpi,
          total: totalIncome,
          inKindItems: incomeData.inKindCount,
          donationCount: incomeData.totalDonations
        },
        expenses: {
          total: expenseData.totalExpenses,
          approved: expenseData.approvedExpenses,
          pending: expenseData.pendingExpenses,
          count: expenseData.totalCount
        },
        balance: {
          current: netBalance,
          projected: projectedBalance,
          cashFlow: totalIncome > expenseData.approvedExpenses ? 'positive' : 'negative'
        },
        period: {
          startDate,
          endDate,
          event
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = async (req, res, next) => {
  try {
    const { itemType, status } = req.query;

    const matchCriteria = {};
    if (itemType) matchCriteria.itemType = itemType;
    if (status) matchCriteria.status = status;

    // Inventory summary
    const inventorySummary = await Inventory.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$itemType',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' },
          usedQuantity: { $sum: { $subtract: ['$quantity', '$remainingQuantity'] } }
        }
      }
    ]);

    // Status-wise breakdown
    const statusBreakdown = await Inventory.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' }
        }
      }
    ]);

    // Usage tracking
    const usageStats = await Inventory.aggregate([
      { $match: matchCriteria },
      { $unwind: { path: '$usageHistory', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$usageHistory.purpose',
          totalUsed: { $sum: '$usageHistory.quantityUsed' },
          usageCount: { $sum: 1 }
        }
      }
    ]);

    // Get detailed inventory
    const inventory = await Inventory.find(matchCriteria)
      .populate('donationId', 'donationId donor')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        summary: inventorySummary,
        statusBreakdown,
        usageStats,
        inventory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor report
// @route   GET /api/reports/donors
// @access  Private
const getDonorReport = async (req, res, next) => {
  try {
    const { startDate, endDate, minAmount } = req.query;

    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }

    // Donor statistics
    const donorStats = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            name: '$donor.name',
            mobile: '$donor.mobile'
          },
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          cashDonations: {
            $sum: { $cond: [{ $eq: ['$type', 'cash'] }, 1, 0] }
          },
          upiDonations: {
            $sum: { $cond: [{ $eq: ['$type', 'upi'] }, 1, 0] }
          },
          inKindDonations: {
            $sum: { $cond: [{ $eq: ['$type', 'in-kind'] }, 1, 0] }
          },
          lastDonation: { $max: '$createdAt' },
          events: { $addToSet: '$event' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Filter by minimum amount if specified
    const filteredDonors = minAmount 
      ? donorStats.filter(donor => donor.totalAmount >= parseFloat(minAmount))
      : donorStats;

    // Top donors (by amount)
    const topDonors = filteredDonors.slice(0, 10);

    // Frequent donors (by count)
    const frequentDonors = [...filteredDonors]
      .sort((a, b) => b.totalDonations - a.totalDonations)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalDonors: filteredDonors.length,
        topDonors,
        frequentDonors,
        allDonors: filteredDonors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export report data
// @route   POST /api/reports/export
// @access  Private (Admin only)
const exportReport = async (req, res, next) => {
  try {
    const { reportType, format, filters } = req.body;

    let data;
    let filename;

    // Simulate the request object for existing functions
    const mockReq = { 
      query: filters || {},
      user: req.user 
    };
    const mockRes = {
      data: null,
      status: () => mockRes,
      json: (result) => { mockRes.data = result; return mockRes; }
    };

    switch (reportType) {
      case 'financial-summary':
        await getDashboardStats(mockReq, mockRes, next);
        data = mockRes.data?.data;
        filename = `financial-summary-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'donations':
        await getIncomeReport(mockReq, mockRes, next);
        data = mockRes.data?.data;
        filename = `donation-report-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'expenses':
        await getExpenseReport(mockReq, mockRes, next);
        data = mockRes.data?.data;
        filename = `expense-report-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'balance':
        await getBalanceSheet(mockReq, mockRes, next);
        data = mockRes.data?.data;
        filename = `balance-sheet-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'inventory':
        await getInventoryReport(mockReq, mockRes, next);
        data = mockRes.data?.data;
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'donors':
        await getDonorReport(mockReq, mockRes, next);
        data = mockRes.data?.data;
        filename = `donor-report-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report data'
      });
    }

    res.status(200).json({
      success: true,
      message: `${reportType} report export completed`,
      data,
      filename,
      format: format || 'json',
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all scheduled reports
// @route   GET /api/reports/scheduled
// @access  Private
const getScheduledReports = async (req, res, next) => {
  try {
    const ScheduledReport = require('../models/ScheduledReport');
    
    const scheduledReports = await ScheduledReport.find({ createdBy: req.user.id })
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scheduledReports.length,
      data: scheduledReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create scheduled report
// @route   POST /api/reports/schedule
// @access  Private
const createScheduledReport = async (req, res, next) => {
  try {
    const ScheduledReport = require('../models/ScheduledReport');
    
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const scheduledReport = await ScheduledReport.create(req.body);

    res.status(201).json({
      success: true,
      data: scheduledReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update scheduled report
// @route   PATCH /api/reports/scheduled/:id
// @access  Private
const updateScheduledReport = async (req, res, next) => {
  try {
    const ScheduledReport = require('../models/ScheduledReport');
    
    let scheduledReport = await ScheduledReport.findById(req.params.id);

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    // Make sure user owns the scheduled report
    if (scheduledReport.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this scheduled report'
      });
    }

    scheduledReport = await ScheduledReport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: scheduledReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete scheduled report
// @route   DELETE /api/reports/scheduled/:id
// @access  Private
const deleteScheduledReport = async (req, res, next) => {
  try {
    const ScheduledReport = require('../models/ScheduledReport');
    
    const scheduledReport = await ScheduledReport.findById(req.params.id);

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    // Make sure user owns the scheduled report
    if (scheduledReport.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this scheduled report'
      });
    }

    await scheduledReport.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scheduled reports due for execution
// @route   GET /api/reports/scheduled/due
// @access  Private (Admin only)
const getDueScheduledReports = async (req, res, next) => {
  try {
    const ScheduledReport = require('../models/ScheduledReport');
    
    const now = new Date();
    const dueReports = await ScheduledReport.find({
      active: true,
      nextRun: { $lte: now }
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: dueReports.length,
      data: dueReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute scheduled report
// @route   POST /api/reports/scheduled/:id/execute
// @access  Private (Admin only)
const executeScheduledReport = async (req, res, next) => {
  try {
    const ScheduledReport = require('../models/ScheduledReport');
    
    const scheduledReport = await ScheduledReport.findById(req.params.id);

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    if (!scheduledReport.active) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled report is not active'
      });
    }

    try {
      // Generate report data
      const mockReq = { 
        query: scheduledReport.filters || {},
        user: req.user 
      };
      const mockRes = {
        data: null,
        status: () => mockRes,
        json: (result) => { mockRes.data = result; return mockRes; }
      };

      // Call appropriate report function
      switch (scheduledReport.reportType) {
        case 'financial-summary':
          await getDashboardStats(mockReq, mockRes, next);
          break;
        case 'donations':
          await getIncomeReport(mockReq, mockRes, next);
          break;
        case 'expenses':
          await getExpenseReport(mockReq, mockRes, next);
          break;
        case 'balance':
          await getBalanceSheet(mockReq, mockRes, next);
          break;
        case 'inventory':
          await getInventoryReport(mockReq, mockRes, next);
          break;
        case 'donors':
          await getDonorReport(mockReq, mockRes, next);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Update schedule execution tracking
      scheduledReport.lastRun = new Date();
      scheduledReport.nextRun = scheduledReport.calculateNextRun();
      scheduledReport.runCount += 1;
      scheduledReport.lastError = null;
      await scheduledReport.save();

      res.status(200).json({
        success: true,
        message: 'Scheduled report executed successfully',
        data: {
          reportData: mockRes.data?.data,
          nextRun: scheduledReport.nextRun,
          runCount: scheduledReport.runCount
        }
      });

    } catch (error) {
      // Update failure tracking
      scheduledReport.failureCount += 1;
      scheduledReport.lastError = error.message;
      await scheduledReport.save();
      
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getIncomeReport,
  getExpenseReport,
  getBalanceSheet,
  getInventoryReport,
  getDonorReport,
  exportReport,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getDueScheduledReports,
  executeScheduledReport
};