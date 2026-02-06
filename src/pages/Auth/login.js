import Logo from "../../assets/images/OtamatLogo.png";
import loginbg from "../../assets/svg/bg.jpg";
import eye from "../../assets/svg/eye-fill.svg";
import eye2 from "../../assets/svg/eye-slash.svg";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingIndicator } from "../../components/loader";
import './styles.css'
import axios from 'axios'
import { useNavigate } from "react-router-dom";
import { adminUrl } from "../../utils/const";
import { message } from "antd";
import { useGoogleLogin } from "@react-oauth/google";

export const Login = () => {
  const [loading, setLoading] = useState(false)
  const [toggle2, setToggle2] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  
  const googleLoginURL = `${adminUrl}/google_login`;

  const Login = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${adminUrl}/login`, {
        email,
        password,
        app:'akkio'
      });
      localStorage.setItem('user', JSON.stringify(response.data))
      if (response.data) {
        if (email === 'superadmin@gmail.com') {
          navigate('/admin/organizations');
          return;
        } else {
          navigate('/welcome');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => getUserInfo(tokenResponse.access_token),
    onFailure: (response) => {
      console.error('Google login failed:', response);
      message.error('Google login failed. Please try again.');
    },
  });

  const getUserInfo = async (token) => {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      handleGoogleLoginSuccess(response.data);
    } catch (error) {
      console.error("Error fetching Google user info:", error);
      message.error('Failed to fetch Google user info.');
    }
  };

  const handleGoogleLoginSuccess = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post(googleLoginURL, {
        username: data.name.replaceAll(" ", "_"),
        id: data.id,
        email: data.email,
        organization: "673dff11ab5f4148582def42",
        roles: ["67945a230af44462b4451f9c"],
        app: "akkio"
      });
      
      if (response.status === 200) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem("username", data?.name.replaceAll(" ", "_"));
        localStorage.setItem("email", data?.email);
        localStorage.setItem("_id", response?.data._id);

        if (data?.email === 'superadmin@gmail.com') {
          navigate('/admin/organizations');
        } else {
          navigate('/welcome');
        }
      } else {
        message.error('Google login failed');
      }
    } catch (error) {
      console.error("Google login error:", error);
      message.error('Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid row m-0 p-0 vh-100">
      <div className="col-md-6 col-xs-12 col-sm-12 text-center pt-lg-5 mt-lg-5">
        <div className="pt-5">
          <img className="logo1" src={Logo} alt="Logo" width={160}  height={130}/>
        </div>
        <div className="row mt-3">
          <div className="col-md-9 col-lg-9 col-sm-12 col-xs-12 mx-auto">

            <h2 className="mb-5">
              {'Login'}
            </h2>

            <div className="mb-4">
              <button
                type="button"
                className="btn w-100 d-flex align-items-center justify-content-center"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "40px",
                  height: "40px",
                  color: "#757575"
                }}
              >
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAORSURBVHgBtZfNbxNHGMaf2d0EB/qxLpUsLIduLlVUqWXTSlUvldakPVZF6qGoF5JzVSXtpZeoWdo/oEY99FQ5qEItEohEHDgQ4eWCICDiXIgFElk+JGQg8oaIxCHxvLzjiChOduOv5JHW9s6M5zfzzjvPzgo0qDnbMvWO2DEBYUPgAy6y+DJB8Pk+kKAZKeH13Cp4jfQn6gK/6HUMqQ0xwIEgE/WlBpIxVmjiUL7go1nw+gy7RoXAMFqTL0BuaqpwumHwnN1rGZ0ih/VwtiU9kcgkL3o/by03thY8tj+yqQMMbSisdVUpFp2w8hqwmil10gWopNkd5df2L6fDKrSaUdQJr5E67OuEYUOjnu6pWaEu7jgOSWkCateSyFPQHs8PwvraWONHn/eO8q0bSiQRCI1Opm7MZrCDeAdYvAP+JNDC4anZgZ3aVsHLOVhLE4nc0rX3rFAokE7dvJPHLmo91BLOgW+K1oH+Z9saCCGHdxta7Vd9lCcxzb9s9Xv1/n4snkuiUupgKI2lbhQGsQcSKsxCYm5zoYK++LcbKHb2HLoe7T7tyJAV2PoWG9Hjq4j/dN+LfcX2t4O+H5nMCKEdQbOSlZOGIN4+4cY5U+//AgpKDpqUBCY0EWEWRAiwR+KMNrXI2piFvZTGjhPuLCv+btlmBFhEJJCG5pOmYarmi1IOZpdEaXP5k7Uu/Pr8E9x99U5ffvByy+ZxfORKjg8PzrYKKdNaPM2hFvDelN0um/jx6ae49+otnrQcQos67uasUCir/NLIV5OLKriqvs++6GboZzzjWLUBr/+Ane0/hla0VnHDK8gbz6SDKrhsIDMy/3GQCT7c1oy3W9bOfm2jCf3wW26I/fZEWJ0Q+pj6roJVuCcXE6ci+jEF5LT9z9GGzl7OX7+MSpJRj0//v9/T1ed2jWf1ZY9OQx1fo+WzsbgQlZn8oFdNOjvrqG1nadC+JQg1OPP90pc4yNdWsb0OhIK5E4ttUMHb3sOxlQSSxe/QsbbR1dj/f/RvPOlqnItn4RMkn5Gobbss7yviUfIMlmIP1K1f1rWak+Y2y1QhZHgfw320qVVjAQ+TZzyG9o276ZrJRB7o/57OWucLl9z58vwJtCQKCNqp/OCkG1Zb9xVGrTtId/mNosEBMJDEaU7AjFq6qFZ1wZsGwFmiO+odKt5lHimVA7y7721rYWXRPxiLB/PLpQectuPsHHkG1s2R17KaTnlOqfV9AAAAAElFTkSuQmCC"
                  alt="Google"
                  width="18"
                  height="18"
                  className="me-2"
                />
                Sign in with Google
              </button>
            </div>

            {/* Divider */}
            <div className="d-flex align-items-center mb-4">
              <div className="flex-grow-1 border-top"></div>
              <div className="mx-3 text-muted small">OR CONTINUE WITH</div>
              <div className="flex-grow-1 border-top"></div>
            </div>

            <form onSubmit={(event) => Login(event)} className="pr-lg-5 pl-lg-5">
              <div
                className="form-group d-flex flex-column"
                style={{ textAlign: "start" }}
              >
                <label className="label2 fs13 ">{"Email"}*</label>
                <input
                  style={{ borderRadius: "40px" }}
                  type="email"
                  className="form-control border"
                  id="email"
                  name="email"
                  autoComplete="off"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                // onFocus={() => setMessage("")}
                />
              </div>

              <div
                className="form-group d-flex flex-column mt-3"
                style={{ textAlign: "start" }}
              >
                <label className="label2 fs13 ">{"Password"}*</label>
                <input
                  style={{ borderRadius: "40px" }}
                  type={toggle2 ? "text" : "password"}
                  className="form-control border"
                  id="password"
                  name="password"
                  value={password}
                  maxLength={16}
                  minLength={8}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                // onFocus={() => setMessage("")}
                />
                <div className="relative">
                  <img
                    className="eye3"
                    src={toggle2 ? eye2 : eye}
                    onClick={() => setToggle2(!toggle2)}
                    alt="Logo"
                  />
                </div>
              </div>
              <div className="d-flex flex-row-reverse mb-4">
                <Link to="#">
                  <span className="fs-12 cursor-pointer">
                    Forgot Password
                  </span>
                </Link>
              </div>
              <button
                className="font-weight-bold text-uppercase w-100 text-white border-0 login2"
                style={{
                  backgroundColor: "#466657",
                  borderRadius: "40px",
                  height: "40px",
                }}
                type={loading ? "button" : "submit"}
                disabled={loading}
              >
                {loading ? "Logging in..." : 'Login'} {loading ? <LoadingIndicator size={"1"} /> : null}
              </button>
            </form>
            <div className="account2 mt-2">{"Don't Have An Account?"}</div>
            <Link to="/register" className="text-decoration-none register2">
              <span>  {"Register"}</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="col-md-6 p-0">
        <img className="img-fluid" src={loginbg} alt="Logo" style={{ height: '100vh', width: '100%', overflow: 'auto' }} />
      </div>
    </div>
  )
}