import { useEffect, useState, useContext } from "react";
import DocContext from "../context/DocContext";
import { useNavigate } from "react-router-dom";
import Share from "./Share";
import Version from "./Version";

import Quill from "quill";
import "quill/dist/quill.snow.css";

import { Box } from "@mui/material";
import styled from "@emotion/styled";

import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const Component = styled.div`
  background: #f5f5f5;
`;

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],

  ["clean"],
];

const Editor = () => {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [childState, setChildState] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const docContext = useContext(DocContext);
  docContext.setDocID(id);

  const handleChildStateChange = (newState) => {
    setChildState(newState);
  };

  const ownerID = async () => {
    let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/docOwnerID`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ doc_id: id }),
      credentials: "include",
    });

    data = await data.json();
    docContext.setDocOwner(data);
  };

  const checkAuthorized = async () => {
    let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/authorize`, {
      credentials: "include",
    });
    return data;
  };

  const isLoggedIn = async () => {
    let res = await checkAuthorized();
    res = await res.json();
    if (res.message === "access allowed") {
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    if (docContext.version) return;
    const fetchData = async () => {
      let status = await isLoggedIn();
      if (status === true) {
        let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/email`, {
          credentials: "include",
        });
        data = await data.json();
        let email = data.email;
        setEmail(email);
        const isAllowed = async (id, email) => {
          let res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/checkAuthorized`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ doc_id: id, email: email }),
            credentials: "include",
          });

          res = await res.json();
          if (res.success == true) {
            setRole(res.role);
            sessionStorage.setItem("role", res.role);
            await fetch(`${process.env.REACT_APP_BACKEND_URL}/updateRecentDocs`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ doc_id: id, email: email }),
              credentials: "include",
            });
          } else {
            return navigate("/requestaccess");
          }
        };
        await isAllowed(id, email);
      } else {
        return navigate("/");
      }
    };
    const quillServer = new Quill("#container", {
      theme: "snow",
      readOnly: false,
      modules: { toolbar: toolbarOptions },
    });
    setQuill(quillServer);
    fetchData();
  }, [docContext.version]);
  useEffect(() => {
    const socketServer = io(`${process.env.REACT_APP_BACKEND_URL}`);
    setSocket(socketServer);

    return () => {
      socketServer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      socket === null ||
      quill === null ||
      socket == undefined ||
      quill == undefined 
    )
      return;
    const handleChange = (delta, oldData, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill && quill.on("text-change", handleChange);
    return () => {
      quill && quill.off("text-change", handleChange);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (
      socket === null ||
      quill === null ||
      socket == undefined ||
      quill == undefined
    )
      return;

    const handleChange = (delta) => {
      quill.updateContents(delta);
    };

    socket && socket.on("receive-changes", handleChange);

    return () => {
      socket && socket.off("receive-changes", handleChange);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (quill === null || socket === null) return;
    socket &&
      socket.once("load-document", async (document) => {
        if(childState.length!=0){
          document = JSON.parse(childState);
        }
        quill && quill.setContents(document);
        socket.emit("save-document", quill.getContents());
        if(childState.length!=0){
         setTimeout(() => {
          window.location.reload();
         }, 1000);
        }
        let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/role`, {
          credentials: "include",
        });

        data = await data.json();
        if (data.role === "1") {
          quill && quill.enable(false);
        } else {
          quill && quill.enable();
        }
      });

    async function triggerSocket(email) {
      let templateID = docContext.templateID;
      let templateTitle = docContext.templateTitle;
      socket &&
        (await socket.emit(
          "get-document",
          id,
          email,
          templateID,
          templateTitle
        ));
      ownerID();
    }
    (async (triggerSocket) => {
      let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/email`, {
        credentials: "include",
      });
      data = await data.json();
      let email = data.email;
      triggerSocket(email);
    })(triggerSocket);
  }, [quill, socket,id]);

  useEffect(() => {
    if (
      socket === null ||
      quill === null ||
      socket == undefined ||
      quill == undefined ||
      docContext.version
    )
      return;
    let interval;
    if (role !== "1") {
      interval = setInterval(() => {
        socket.emit("save-document", quill.getContents());
      }, 500);
    }

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill, docContext.version]);

  return (
    <>
      {!docContext.version && <Share />}
      {!docContext.version && (
        <Component>
          <Box className="container" id="container"></Box>
        </Component>
      )}
      {docContext.version && <Version onStateChange = {handleChildStateChange}/>}
    </>
  );
};

export default Editor;
