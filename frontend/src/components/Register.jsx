import React, { useEffect, useState } from "react";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    let res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password:password,
      }),
      credentials: "include",
    });
    res = await res.json();
    console.log(res);
  };
  return (
    <>
      <form>
        <div className="mb-3">
          <label for="exampleInputEmail1" className="form-label">
            Email address
          </label>
          <input
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            type="email"
            className="form-control"
            id="exampleInputEmail1"
            aria-describedby="emailHelp"
          />
          <div id="emailHelp" className="form-text">
            We'll never share your email with anyone else.
          </div>
        </div>
        <div className="mb-3">
          <label for="exampleInputPassword1" className="form-label">
            Password
          </label>
          <input
             onChange={(e) => {
              setPassword(e.target.value);
            }}
            type="password"
            className="form-control"
            id="exampleInputPassword1"
          />
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="exampleCheck1"
          />
          <label className="form-check-label" for="exampleCheck1">
            Check me out
          </label>
        </div>
        <button onClick={register} type="button" className="btn btn-primary">
          Register
        </button>
      </form>
    </>
  );
}

export default Register;
