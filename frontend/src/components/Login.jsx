import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signin = async () => {
    let res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
      credentials: "include",
    });
    res = await res.json();
    if (res.success === false) {
      alert("Incorrect email or password");
    } else {
      navigate("/home");
    }
  };

  const logout = async () => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/test`, {
      credentials: "include",
    });
  };

  return (
    <>
      <form>
        <div class="mb-3">
          <label for="exampleInputEmail1" class="form-label">
            Email address
          </label>
          <input
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            type="email"
            class="form-control"
            id="exampleInputEmail1"
            aria-describedby="emailHelp"
          />
          <div id="emailHelp" class="form-text">
            We'll never share your email with anyone else.
          </div>
        </div>
        <div class="mb-3">
          <label for="exampleInputPassword1" class="form-label">
            Password
          </label>
          <input
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            type="password"
            class="form-control"
            id="exampleInputPassword1"
          />
        </div>
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="exampleCheck1" />
          <label class="form-check-label" for="exampleCheck1">
            Check me out
          </label>
        </div>
        <button onClick={signin} type="button" class="btn btn-primary">
          Submit
        </button>
      </form>
      <h6 className="text-center mb-4">Or sign in with your social network</h6>
      <div
        style={{ marginLeft: "30%" }}
        className="row row-cols-1 row-cols-sm-2"
      >
        <div className="col mb-3">
          <a
            href={`${process.env.REACT_APP_BACKEND_URL}/auth/google`}
            className="btn btn-icon btn-danger btn-google btn-lg w-100 text-light"
          >
            <i className="bx bxl-google fs-xl me-2"></i>
            Google
          </a>
        </div>
      </div>

      <button onClick={logout}>Logout</button>
    </>
  );
}

export default Login;
