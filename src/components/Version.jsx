import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import DocContext from "../context/DocContext";

import Quill from "quill";
import "quill/dist/quill.snow.css";


function Version() {
  const { id } = useParams();
  const [versions, setVersions] = useState([]);
  const [quillView, setQuillViewer] = useState();
  const [timeDate, setTimeDate] = useState("");
  const docContext = useContext(DocContext);

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
      setVersions(versions);
    })();
    const quillServer = new Quill("#containerVersion", {
      theme: "snow",
      readOnly: true,
      "modules":{
        "toolbar": false
      }
    });
    setQuillViewer(quillServer);
  }, []);

  useEffect(() => {
    if (versions.length > 0) {
      let firstVersion = versions[0].data;
      setTimeDate(versions[0].time);
      firstVersion = JSON.parse(firstVersion);
      quillView && quillView.setContents(firstVersion);
      quillView.enable(false);
    }
  }, [quillView, versions]);

  return (
    <>
      <nav class="navbar navbar-expand-lg ">
        <div style={{ display: "flex" }}>
          <img
            onClick={() => {
              docContext.setVersion(false);
            }}
            style={{ height: "30px" }}
            src="/assets/back.png"
          />
          <h4 style={{ marginLeft: "10px" }}>
            {new Date(timeDate).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </h4>
        </div>
      </nav>
      <div style={{display:"flex"}}>
        <div className="container" id="containerVersion"></div>
        <div style={{padding:"15%"}}></div>
      </div>
    </>
  );
}

export default Version;
