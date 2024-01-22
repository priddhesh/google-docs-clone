import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signin = async () => {
    let res =  await fetch(`http://localhost:5001/api/signin`, {
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
    if(res.success===false){
      alert("Incorrect email or password");
    }else{
      navigate("/home");
    }
  };

  const logout = async()=>{
    await fetch(`http://localhost:5001/test`,{
      credentials:"include",
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
      <button onClick={logout}>Logout</button>
    </>
  );
}

export default Login;
