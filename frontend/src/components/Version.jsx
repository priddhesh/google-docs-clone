import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DocContext from "../context/DocContext";

import Quill from "quill";
import "quill/dist/quill.snow.css";

function Version({onStateChange}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [versionID,setVersionID] = useState(0);
  const [quillView, setQuillViewer] = useState();
  const [timeDate, setTimeDate] = useState("");
  const [localState, setLocalState] = useState([]);
  const docContext = useContext(DocContext);

  const handleVersionClick = async (e) => {
    let id = parseInt(e.target.id);
    setVersionID(id);
    quillView.setContents(JSON.parse(versions[id].data));
  };
  
  const restore = async(e)=>{
    let id = JSON.parse(versionID);
    setLocalState(versions[id].data);
    onStateChange(versions[id].data);
    docContext.version = false;
  }
  useEffect(() => {
    (async () => {
      let versions = await fetch(`${process.env.REACT_APP_BACKEND_URL}/versions`, {
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
      modules: {
        toolbar: false,
      },
    });
    setQuillViewer(quillServer);
  }, []);

  useEffect(() => {
    if (versions.length > 0) {
      let firstVersion = versions[versionID].data;
      setTimeDate(versions[versionID].time);
      firstVersion = JSON.parse(firstVersion);
      quillView && quillView.setContents(firstVersion);
      quillView.enable(false);
    }
  }, [quillView, versions,versionID]);

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
          {versionID!=0 && <button type="button" class="btn btn-primary" onClick={restore}>Restore version</button>}
        </div>
      </nav>
      <div style={{ display: "flex" }}>
        <div className="container" id="containerVersion"></div>
        <div style={{ margin: "0% 5% 0% 5%" }}>
          {versions.map((version, idx) => (
            <div id={idx} onClick={handleVersionClick}
              class="card"
              style={{ width: "18rem" }}
            >
              <div id={idx} onClick={handleVersionClick} key={idx} class="card-body">
                {version.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Version;
