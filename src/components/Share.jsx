import React from "react";
import { useState, useEffect,useContext} from "react";
import DocContext from "../context/DocContext";
import { useParams } from "react-router-dom";

function Share() {
  const docContext = useContext(DocContext);

  const [emailSDoc, setEmailSDoc] = useState("");
  const [stage, setStage] = useState(0);
  const [role, setRole] = useState("Editor");
  const [msg, setMsg] = useState(false);
  const [notification, setNotification] = useState("");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trigger,setTrigger] = useState(true);
  const [docTitle,setDocTitle] = useState("");
  const [version, setVersion] = useState(false);
  const { id } = useParams();
  const validateMail = (maildID) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const validity = gmailRegex.test(maildID);
    if (validity === true) {
      setStage(1);
    } else {
      alert("Invalid email");
    }
  };

  const updateAccess = async () => {
    //setLoading(true);
    let data = await fetch(`http://localhost:5001/updateAccess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doc_id: id,
        email: emailSDoc,
        role: role,
        notify: msg,
        message: notification,
      }),
      credentials: "include",
    });
    data = await data.json();
    setStage(0);
    setPeople(data);
   // setLoading(false);
  };

  useEffect(() => {
    const getUsersWithAccess = async () => {
      try {
      //  setLoading(true);
        let users = await fetch(`http://localhost:5001/getUsersWithAccess`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ doc_id: id }),
          credentials: "include",
        });
        users = await users.json();
        setPeople(users);
      //  setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    getUsersWithAccess();
  }, [role]);

  useEffect(() => {
    (async()=>{
       let data = await fetch(`http://localhost:5001/doc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ docID: id }),
        credentials: "include",
      })
      data = await data.json();
      if(docContext.templateTitle!=""){
        setDocTitle(docContext.templateTitle);
      }else{
      setDocTitle(data.title);
      }
    }
    )();
  }, [])
  
   
  const changeDocTitle = async(title)=>{
    let res = fetch(`http://localhost:5001/changeDocTitle`,{
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ docTitle: title,docID: id }),
      credentials: "include",
    })
  }

  // const throttle = (func, delay) => {
  //   let throttled = false;
    
  //   return function (...args) {
  //     if (!throttled) {
  //       func.apply(this, args);
  //       throttled = true;
  //       setTimeout(() => {
  //         throttled = false;
  //       }, delay);
  //     }
  //   };
  // };
  
  const debounce = (func, delay=500) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };
  
  const handleInputChange = (e)=>{
    if(e.target.value!=""){
    setDocTitle(e.target.value);
    }
    else{
      setDocTitle("Untitled document");
    }
    debounce(changeDocTitle(e.target.value==""?"Untitled document":e.target.value));
  }
  return (
    <>
    {loading && <h1>Loading..</h1>}
      {!loading && 
      <div style={{display:"flex"}}>
      <input style={{maxWidth:"10%", maxHeight:"20px",margin:"auto 0px auto 0px"}} type="text" id="btnC" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" value={docTitle} onChange={handleInputChange}/>
      <button
        type="button"
        className="btn btn-primary"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
        onClick={()=>{
          setTrigger(!trigger);
        }}
      >
        Share
      </button>
      <img onClick={()=>{
        docContext.setVersion(true);
      }} style={{height:"20px",margin:"auto"}} src="/assets/history.png"/>
      </div>
     }

     <div
        className="modal fade"
        id="exampleModal"
        tabindex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        {stage === 0 && (
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="exampleModalLabel">
                  Share Doc
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="input-group mb-3">
                  <input
                    onChange={(e) => {
                      setEmailSDoc(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        validateMail(emailSDoc);
                      }
                    }}
                    type="text"
                    className="form-control"
                    aria-label="Sizing example input"
                    aria-describedby="inputGroup-sizing-default"
                    placeholder="Add people"
                  />
                </div>
                <h6>People with access</h6>
                <div className="list-container">
                  <div>
                  <ul className="list-group">
                    {people.map((id, key) => {
                      const emailID = id.split("-")[0];
                      const role = id.split("-")[1];

                      return (
                        <div key={key} style={{display:"flex"}} className="list-item-container">
                          <li className="list-group-item">{emailID}</li>
                          <p id="role" className="role-text">
                            {role === "1" ? "Viewer" : role==="0"?"Owner": "Editor"}
                          </p>
                        </div>
                      );
                    })}
                  </ul>
                </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}
        {stage === 1 && (
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  onClick={() => {
                    setStage(0);
                  }}
                  className="btn btn-primary"
                  type="submit"
                >
                  Back
                </button>
                <h1 className="modal-title fs-5" id="exampleModalLabel">
                  Share Doc
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div style={{ display: "flex" }}>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      aria-label="Sizing example input"
                      aria-describedby="inputGroup-sizing-default"
                      value={emailSDoc}
                    />
                  </div>
                  <div className="dropdown">
                    <button
                      className="btn btn-secondary dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {role}
                    </button>
                    <ul className="dropdown-menu">
                      <li
                        onClick={() => {
                          setRole("Viewer");
                        }}
                      >
                        {
                          <a className="dropdown-item">
                            Viewer {role === "Viewer" ? "✔" : ""}
                          </a>
                        }
                      </li>
                      <li
                        onClick={() => {
                          setRole("Editor");
                        }}
                      >
                        {
                          <a className="dropdown-item">
                            Editor {role === "Editor" ? "✔" : ""}
                          </a>
                        }
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="exampleCheck1"
                    onClick={() => {
                      setMsg(!msg);
                    }}
                  />
                  <label className="form-check-label" for="exampleCheck1">
                    Notify People
                  </label>
                </div>
                {msg && (
                  <div className="input-group">
                    <textarea
                      onChange={(e) => {
                        setNotification(e.target.value);
                      }}
                      className="form-control"
                      aria-label="With textarea"
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => {
                    setStage(0);
                  }}
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={updateAccess}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Share;
