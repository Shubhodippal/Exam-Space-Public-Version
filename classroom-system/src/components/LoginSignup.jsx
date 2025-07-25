import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import bcrypt from 'bcryptjs' 
import { useAuth } from '../contexts/AuthContext' 

function LoginSignup() {
  const navigate = useNavigate()
  const { checkAuthentication } = useAuth() 
  
  const [mode, setMode] = useState('login')
  
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    phone: '' 
  })
  const [otpData, setOtpData] = useState({ 
    otp: '', 
    otpToken: '' 
  })
  const [resetData, setResetData] = useState({
    email: '',
    otp: '',
    otpToken: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false
  })
  const [otpSent, setOtpSent] = useState(false)
  const [resetStep, setResetStep] = useState(1) 

  useEffect(() => {
    const password = mode === 'signup' ? signupData.password : resetData.newPassword
    setPasswordStrength({
      minLength: password.length >= 8,
      hasLetter: /[A-Za-z]/.test(password),
      hasNumber: /\d/.test(password)
    })
  }, [signupData.password, resetData.newPassword, mode])

  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value })
  }

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value })
  }

  const handleOtpChange = (e) => {
    setOtpData({ ...otpData, [e.target.name]: e.target.value })
  }

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value })
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);

        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        setMessage({ type: 'success', text: 'Login successful!' });

        await checkAuthentication();

        navigate('/');
      } else {
        setMessage({ type: 'error', text: data.message || 'Login failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRequestSignupOtp = async (e) => {
    e.preventDefault()
    
    if (!signupData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' })
      return
    }
    
    if (!signupData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' })
      return
    }
    
    if (!signupData.password) {
      setMessage({ type: 'error', text: 'Password is required' })
      return
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    
    if (!passwordStrength.minLength || !passwordStrength.hasLetter || !passwordStrength.hasNumber) {
      setMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters with at least one letter and one number' 
      })
      return
    }
    
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          email: signupData.email,
          type: 'signup'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setOtpData({ ...otpData, otpToken: data.otpToken })
        setMessage({ type: 'success', text: 'OTP sent to your email' })
        setOtpSent(true)
        setMode('otpVerification')
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send OTP' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    
    if (!otpData.otp.trim()) {
      setMessage({ type: 'error', text: 'OTP is required' })
      return
    }
    
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const decodedToken = decodeJwt(otpData.otpToken)
      
      if (!decodedToken) {
        setMessage({ type: 'error', text: 'Invalid OTP token. Please request a new OTP.' })
        setIsSubmitting(false)
        return
      }
      
      const encodedOtp = decodedToken.encodedOtp
      
      if (!encodedOtp) {
        setMessage({ type: 'error', text: 'Invalid token data. Please request a new OTP.' })
        setIsSubmitting(false)
        return
      }
      
      const isOtpValid = await bcrypt.compare(otpData.otp, encodedOtp)
      
      if (isOtpValid) {
        handleSignupSubmit(e)
      } else {
        setMessage({ type: 'error', text: 'Invalid OTP. Please try again.' })
        setIsSubmitting(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Error verifying OTP. Please try again.' })
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY 
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          phone: signupData.phone || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Registration successful! You can now log in.' })
        setTimeout(() => {
          setMode('login')
          setSignupData({ name: '', email: '', password: '', confirmPassword: '', phone: '' })
          setOtpData({ otp: '', otpToken: '' })
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestResetOtp = async (e) => {
    e.preventDefault()
    
    if (!resetData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' })
      return
    }
    
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY 
        },
        body: JSON.stringify({
          email: resetData.email,
          type: 'reset'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResetData({ ...resetData, otpToken: data.otpToken })
        setMessage({ type: 'success', text: 'OTP sent to your email' })
        setResetStep(2)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send OTP' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyResetOtp = async (e) => {
    e.preventDefault()
    
    if (!resetData.otp.trim()) {
      setMessage({ type: 'error', text: 'OTP is required' })
      return
    }
    
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const decodedToken = decodeJwt(resetData.otpToken)
      
      if (!decodedToken) {
        setMessage({ type: 'error', text: 'Invalid OTP token. Please request a new OTP.' })
        setIsSubmitting(false)
        return
      }
      
      const encodedOtp = decodedToken.encodedOtp
      
      if (!encodedOtp) {
        setMessage({ type: 'error', text: 'Invalid token data. Please request a new OTP.' })
        setIsSubmitting(false)
        return
      }
      
      const isOtpValid = await bcrypt.compare(resetData.otp, encodedOtp)
      
      if (isOtpValid) {
        setMessage({ type: 'success', text: 'OTP verified successfully' })
        setResetStep(3)
      } else {
        setMessage({ type: 'error', text: 'Invalid OTP. Please try again.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error verifying OTP. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (resetData.newPassword !== resetData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    
    if (!passwordStrength.minLength || !passwordStrength.hasLetter || !passwordStrength.hasNumber) {
      setMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters with at least one letter and one number' 
      })
      return
    }
    
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          email: resetData.email,
          newPassword: resetData.newPassword,
          otp: resetData.otp,
          otpToken: resetData.otpToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password reset successful! You can now log in.' })
        setTimeout(() => {
          setMode('login')
          setResetData({ email: '', otp: '', otpToken: '', newPassword: '', confirmPassword: '' })
          setResetStep(1)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Password reset failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setLoginData({ email: '', password: '' })
    setSignupData({ name: '', email: '', password: '', confirmPassword: '', phone: '' })
    setOtpData({ otp: '', otpToken: '' })
    setResetData({ email: '', otp: '', otpToken: '', newPassword: '', confirmPassword: '' })
    setMessage({ type: '', text: '' })
    setOtpSent(false)
    setResetStep(1)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="auth-container">
      {mode === 'login' && (
        <div className="auth-form">
          <h2>Login to ExamSpace</h2>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={isSubmitting}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            
            <div className="auth-forgot-password">
              <button 
                type="button" 
                className="auth-toggle-btn"
                onClick={() => {
                  resetForm()
                  setMode('resetPassword')
                }}
                disabled={isSubmitting}
              >
                Forgot Password?
              </button>
            </div>
            
            {message.text && (
              <div className={`status-message ${message.type}`}>
                {message.type === 'success' ? '✅ ' : message.type === 'error' ? '❌ ' : ''}
                {message.text}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="auth-toggle">
            <p>Don't have an account?</p>
            <button 
              type="button" 
              className="auth-toggle-btn"
              onClick={() => {
                resetForm()
                setMode('signup')
              }}
              disabled={isSubmitting}
            >
              Sign up
            </button>
          </div>
        </div>
      )}

      {mode === 'signup' && (
        <div className="auth-form">
          <h2>Create an Account</h2>
          <form onSubmit={handleRequestSignupOtp}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={signupData.phone}
                onChange={handleSignupChange}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={isSubmitting}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            
            <div className="password-requirements">
              <div className={`requirement ${passwordStrength.minLength ? 'valid' : 'invalid'}`}>
                {passwordStrength.minLength ? '✓' : '✗'} At least 8 characters
              </div>
              <div className={`requirement ${passwordStrength.hasLetter ? 'valid' : 'invalid'}`}>
                {passwordStrength.hasLetter ? '✓' : '✗'} At least one letter
              </div>
              <div className={`requirement ${passwordStrength.hasNumber ? 'valid' : 'invalid'}`}>
                {passwordStrength.hasNumber ? '✓' : '✗'} At least one number
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            {message.text && (
              <div className={`status-message ${message.type}`}>
                {message.type === 'success' ? '✅ ' : message.type === 'error' ? '❌ ' : ''}
                {message.text}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Request OTP'}
            </button>
          </form>
          
          <div className="auth-toggle">
            <p>Already have an account?</p>
            <button 
              type="button" 
              className="auth-toggle-btn"
              onClick={() => {
                resetForm()
                setMode('login')
              }}
              disabled={isSubmitting}
            >
              Login
            </button>
          </div>
        </div>
      )}

      {mode === 'otpVerification' && (
        <div className="auth-form">
          <h2>Verify Your Email</h2>
          <p>We've sent a 6-digit OTP to your email address.</p>
          <form onSubmit={verifyOtp}>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otpData.otp}
                onChange={handleOtpChange}
                placeholder="Enter 6-digit code"
                maxLength="6"
                pattern="\d{6}"
                required
                disabled={isSubmitting}
              />
            </div>
            
            {message.text && (
              <div className={`status-message ${message.type}`}>
                {message.type === 'success' ? '✅ ' : message.type === 'error' ? '❌ ' : ''}
                {message.text}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Complete Registration'}
            </button>
          </form>
          
          <div className="auth-toggle">
            <p>Didn't receive the code?</p>
            <button 
              type="button" 
              className="auth-toggle-btn"
              onClick={handleRequestSignupOtp}
              disabled={isSubmitting}
            >
              Resend OTP
            </button>
            <p>or</p>
            <button 
              type="button" 
              className="auth-toggle-btn"
              onClick={() => {
                resetForm()
                setMode('signup')
              }}
              disabled={isSubmitting}
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {mode === 'resetPassword' && (
        <div className="auth-form">
          <h2>Reset Your Password</h2>
          
          {resetStep === 1 && (
            <form onSubmit={handleRequestResetOtp}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email Address</label>
                <input
                  type="email"
                  id="resetEmail"
                  name="email"
                  value={resetData.email}
                  onChange={handleResetChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {message.text && (
                <div className={`status-message ${message.type}`}>
                  {message.type === 'success' ? '✅ ' : message.type === 'error' ? '❌ ' : ''}
                  {message.text}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Request OTP'}
              </button>
            </form>
          )}
          
          {resetStep === 2 && (
            <form onSubmit={verifyResetOtp}>
              <p>We've sent a 6-digit OTP to your email address.</p>
              <div className="form-group">
                <label htmlFor="resetOtp">Enter OTP</label>
                <input
                  type="text"
                  id="resetOtp"
                  name="otp"
                  value={resetData.otp}
                  onChange={handleResetChange}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  pattern="\d{6}"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {message.text && (
                <div className={`status-message ${message.type}`}>
                  {message.type === 'success' ? '✅ ' : message.type === 'error' ? '❌ ' : ''}
                  {message.text}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <div className="auth-toggle">
                <p>Didn't receive the code?</p>
                <button 
                  type="button" 
                  className="auth-toggle-btn"
                  onClick={handleRequestResetOtp}
                  disabled={isSubmitting}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
          
          {resetStep === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    required
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isSubmitting}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              
              <div className="password-requirements">
                <div className={`requirement ${passwordStrength.minLength ? 'valid' : 'invalid'}`}>
                  {passwordStrength.minLength ? '✓' : '✗'} At least 8 characters
                </div>
                <div className={`requirement ${passwordStrength.hasLetter ? 'valid' : 'invalid'}`}>
                  {passwordStrength.hasLetter ? '✓' : '✗'} At least one letter
                </div>
                <div className={`requirement ${passwordStrength.hasNumber ? 'valid' : 'invalid'}`}>
                  {passwordStrength.hasNumber ? '✓' : '✗'} At least one number
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmNewPassword"
                    name="confirmPassword"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {message.text && (
                <div className={`status-message ${message.type}`}>
                  {message.type === 'success' ? '✅ ' : message.type === 'error' ? '❌ ' : ''}
                  {message.text}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}
          
          <div className="auth-toggle">
            <p>Remember your password?</p>
            <button 
              type="button" 
              className="auth-toggle-btn"
              onClick={() => {
                resetForm()
                setMode('login')
              }}
              disabled={isSubmitting}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginSignup