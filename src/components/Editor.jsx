import { useEffect, useState,useContext } from "react";
import DocContext from "../context/DocContext";
import { useNavigate } from "react-router-dom";
import Share from "./Share";

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
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

const Editor = () => {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [role, setRole] = useState();
  const [email,setEmail] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const docContext = useContext(DocContext);
  docContext.setDocID(id);

  const ownerID  = async()=>{
    let data = await fetch(`http://localhost:5001/docOwnerID`,{
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({ doc_id: id }),
     credentials: "include",
    })

    data = await data.json();
    docContext.setDocOwner(data);
 };

  const checkAuthorized = async () => {
    let data = await fetch(
      `http://localhost:5001/api/authorize`,
      {
        credentials: "include",
      }
    );
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
    const fetchData = async () => {
      let status = await isLoggedIn();
      if (status === true) {
        let data = await fetch(`http://localhost:5001/email`,{
          credentials: "include",
        });
        data = await data.json();
        let email = data.email;
        setEmail(email);
        const isAllowed = async (id, email) => {
          let res = await fetch(`http://localhost:5001/checkAuthorized`, {
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
          } else {
            return navigate("/requestaccess");
          }
        };

        isAllowed(id, email);
      } else {
        return navigate("/");
      }
    };
    fetchData();
    const quillServer = new Quill("#container", {
      theme: "snow",
      readOnly: true,
      modules: { toolbar: toolbarOptions },
    });
    // quillServer.disable();
    // quillServer.setText('Loading the document...');
    setQuill(quillServer);
  }, []);

  useEffect(() => {
    const socketServer = io("http://localhost:5000");
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
      socket.once("load-document", (document) => {
        quill && quill.setContents(document);
        quill && quill.enable();
      });

    async function triggerSocket(email){
      socket && await socket.emit("get-document", id,email);
      ownerID();
    }
    (async(triggerSocket)=>{
      let data = await fetch(`http://localhost:5001/email`,{
        credentials: "include",
      });
      data = await data.json();
      let email = data.email;
      triggerSocket(email);
    })(triggerSocket);
  }, [quill, socket, id]);

  useEffect(() => {
    if (
      socket === null ||
      quill === null ||
      socket == undefined ||
      quill == undefined
    )
      return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  return (
    <>
      <Share />
      <Component>
        <Box className="container" id="container"></Box>
      </Component>
    </>
  );
};

export default Editor;
