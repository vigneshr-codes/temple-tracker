const generateId = (prefix, count) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${prefix}${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
};

module.exports = generateId;