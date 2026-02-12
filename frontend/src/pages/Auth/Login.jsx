import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login, reset } from "../../features/auth/authSlice";
import { addNotification } from "../../features/ui/uiSlice";
import { BACKEND_STATIC_URL } from "../../features/settings/settingsSlice";

// Split name into display lines using | as a manual line-break separator.
// e.g. "OM MAHALINGESWARA|IDAYAMELUR SRILA SRI MAYANDI SIDDHAR|ARAKKATALAI SIDDHAR PEEDAM"
// Falls back to single line if no | present.
const splitNameLines = (name) => name.split('|').filter(Boolean);

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);
  const { templeConfig } = useSelector(state => state.settings);
  const templeName = templeConfig?.name || 'Temple Tracker';
  const logoUrl = templeConfig?.logo ? `${BACKEND_STATIC_URL}${templeConfig.logo}` : null;

  useEffect(() => {
    if (isError) {
      dispatch(
        addNotification({
          type: "error",
          message: message
        })
      );
    }

    if (isSuccess || user) {
      navigate("/");
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const { username, password } = formData;

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const onSubmit = e => {
    e.preventDefault();

    if (!username || !password) {
      dispatch(
        addNotification({
          type: "error",
          message: "Please fill in all fields"
        })
      );
      return;
    }

    const userData = {
      username,
      password
    };

    dispatch(login(userData));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(135deg, #fef7f0 0%, #fef3c7 50%, #fef2f2 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px"
      }}
    >
      {/* Login Card */}
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          {/* Logo */}
          <div
            className="mx-auto mb-5 shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            style={{
              background: logoUrl ? "white" : "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px -8px rgba(245,158,11,0.4), 0 0 0 4px rgba(245,158,11,0.15)"
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={templeName} style={{ width: "88px", height: "88px", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>

          {/* Temple name — broken into lines at ~28-char word boundaries */}
          <h1
            className="font-bold text-gray-900 text-center tracking-wide"
            style={{
              fontSize: templeName.length > 40 ? "13px" : templeName.length > 25 ? "16px" : "20px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              lineHeight: "1.75",
              margin: "0 auto"
            }}
          >
            {splitNameLines(templeName).map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </h1>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-2 my-3">
            <div style={{ height: "1px", width: "32px", background: "linear-gradient(to right, transparent, #f59e0b)" }} />
            <span style={{ color: "#f59e0b", fontSize: "10px" }}>✦</span>
            <div style={{ height: "1px", width: "32px", background: "linear-gradient(to left, transparent, #f59e0b)" }} />
          </div>

          <p className="text-gray-500 text-sm mb-8">
            {templeConfig?.address?.street && templeConfig?.address?.city && templeConfig?.address?.state
              ? `${templeConfig?.address?.street}, ${templeConfig.address.city}, ${templeConfig.address.state}`
              : templeConfig?.address?.city || 'Temple Management System'}
          </p>
        </div>

        {/* Login Form Card */}
        <div
          className="bg-white py-8 px-6 shadow-2xl rounded-2xl border-0"
          style={{
            backgroundColor: "#ffffff",
            padding: "32px 24px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            border: "none"
          }}
        >
          <form className="space-y-6" onSubmit={onSubmit} style={{ marginTop: "0" }}>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-3" style={{ color: "#1f2937", fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #f3f4f6",
                  borderRadius: "12px",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  backgroundColor: "#fafafa"
                }}
                placeholder="Enter your username or email"
                value={username}
                onChange={onChange}
                onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                onBlur={e => (e.target.style.borderColor = "#f3f4f6")}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-3" style={{ color: "#1f2937", fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #f3f4f6",
                  borderRadius: "12px",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  backgroundColor: "#fafafa"
                }}
                placeholder="Enter your password"
                value={password}
                onChange={onChange}
                onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                onBlur={e => (e.target.style.borderColor = "#f3f4f6")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-temple-600 hover:text-temple-500 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl btn-primary">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-temple-300 group-hover:text-temple-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {templeName.replace(/\|/g, ' ')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
