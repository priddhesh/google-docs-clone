import React from "react";
import { useEffect, useState, useContext } from "react";
import DocContext from "../context/DocContext";
import RequestSent from "./RequestSent";

function RequestAccess() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [requested,setRequested] = useState(false);
  const docContext = useContext(DocContext);

  useEffect(() => {
    (async () => {
      let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/email`, {
        credentials: "include",
      });
      data = await data.json();
      let email = data.email;
      setEmail(email);
    })();
  }, []);

  const requestAccess = async () => {
    setRequested(false);
    let docID = docContext.docID;
    let docOwnerID = docContext.docOwner;
    if(docOwnerID!="" && docOwnerID!=undefined){
    let docOwnerEmail = await fetch(`${process.env.REACT_APP_BACKEND_URL}/docOwnerEmail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerID: docOwnerID }),
      credentials: "include",
    });
    docOwnerEmail = await docOwnerEmail.json();
    docOwnerEmail = docOwnerEmail.email;
    sessionStorage.setItem("ownerEmail",docOwnerEmail);
    }
    (async () => {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverEmail: sessionStorage.getItem("ownerEmail"),message:message}),
        credentials: "include",
      });
    })();
    setRequested(true);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <>
      {!requested && <div>
        <h3>You need access</h3>
        <p>Request access, or switch to an account with access. Learn more</p>
        <textarea
          onChange={handleChange}
          placeholder="Message (optional)"
        ></textarea>
        <button onClick={requestAccess}>Request access</button>
      </div>}

      {!requested && <div>
        <p>You're signed in as</p>
        <button>{email}</button>
      </div>}
      {requested && <RequestSent/>}
    </>
  );
}

export default RequestAccess;
