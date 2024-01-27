import React, { useEffect,useState } from "react";
import { useParams } from "react-router-dom";


import Quill from "quill";
import "quill/dist/quill.snow.css";

import { Box } from "@mui/material";
import styled from "@emotion/styled";


const Component = styled.div`
  background: #f5f5f5;
`;

function Version() {
  const { id } = useParams();
  const [versions,setVersions] = useState([]);
  const [quillView,setQuillViewer] = useState();

  useEffect(() => {
      (async () => {
      let versions = await fetch(`http://localhost:5001/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ doc_id: id }),
        credentials: "include",
      });
      versions = await versions.json();
      versions = versions[0].data;
      versions = JSON.parse(versions);
      setVersions(versions);
    })();
    const quillServer = new Quill("#container", {
        theme: "snow",
        readOnly: false,
    });
    setQuillViewer(quillServer);
  }, []);
  
  useEffect(() => {
    if(versions.length>0){
     quillView && quillView.setContents(versions);
     quillView.enable(false);
    }
  }, [quillView,versions])
  

  return (
  <>
     <Component>
        <Box className="container" id="container"></Box>
      </Component>
  </>
  );
}

export default Version;
