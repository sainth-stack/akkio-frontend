import Logo from "../../assets/images/Logo2.jpg";
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

export const Login = () => {
  const [loading, setLoading] = useState(false)
  const [toggle2, setToggle2] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const Login = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);


      const response = await axios.post(`${adminUrl}/login`, {
        email,
        password
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
  return (
    <div className="container-fluid row m-0 p-0 vh-100">
      <div className="col-md-6 col-xs-12 col-sm-12 text-center pt-lg-5 mt-lg-5">
        <div className="pt-5">
          <img className="logo1" src={Logo} alt="Logo" width={300} />
        </div>
        <div className="row mt-3">
          <div className="col-md-9 col-lg-9 col-sm-12 col-xs-12 mx-auto">

            <h2 className="mb-5">

              {'Login'}

            </h2>

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
          </div>
        </div>
      </div>
      <div className="col-md-6 p-0">
        <img className="img-fluid" src={loginbg} alt="Logo" style={{ height: '100vh', width: '100%', overflow: 'auto' }} />
      </div>
    </div>
  )
}