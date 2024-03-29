import React, { useEffect, useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import DocContext from "../context/DocContext";
import { v4 as uuidv4 } from 'uuid';

function Home() {
  const [userID, setUserID] = useState("");
  const [title, setTitle] = useState([]);
  const [docID, setDocID] = useState([]);
  const [date, setDate] = useState([]);
  const [time, setTime] = useState([]);
  const [search,setSearch] = useState("");
  const [searchedDocs,setSearchDocs] = useState([]);
  const [searchState,setSearchState] = useState(false);
  const [templates,setTemplates] = useState([]);
  const navigate = useNavigate();
  const uniqueId = uuidv4();
  const docContext = useContext(DocContext);

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
    const fetchData = async () => {
      let status = await isLoggedIn();
      if (status === true) {
        (async () => {
          let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/email`, {
            credentials: "include",
          });

          data = await data.json();
          let userId = data.userID;
          setUserID(userId);
          let recentDocsData = await fetch(`${process.env.REACT_APP_BACKEND_URL}/recentDocs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: userId }),
            credentials: "include",
          });

          recentDocsData = await recentDocsData.json();
          setTitle(recentDocsData.title);
          setDate(recentDocsData.date);
          setDocID(recentDocsData.id);
          setTime(recentDocsData.time);

          let templates = await fetch(`${process.env.REACT_APP_BACKEND_URL}/templates`,{
            credentials: "include",
          });

          templates = await templates.json();
          console.log(templates);
          setTemplates(templates);
        })();
      } else {
        navigate("/");
      }
    };
    fetchData();
  }, []);

  const setSearchVal = (e) => {
    setSearch(e.target.value);
  };

  const searchDoc = async(e)=>{
    if(e.key==='Enter'){
      if(search.length==0 && searchState==true){
        setSearchState(false);
        return;
      }
      setSearchState(false);
      let data = await fetch(`${process.env.REACT_APP_BACKEND_URL}/searchDocs`,{
        method:"POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userID,search:search }),
        credentials: "include",
      })
      data = await data.json();
      setSearchDocs(data);
      console.log(data);
      setSearchState(true);
    }
  }
  return (
    <>
      <nav class="navbar navbar-expand-lg bg-body-tertiary fixed-top">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            Docs
          </a>
          <div class="mx-auto order-0">
              <input
                onChange={setSearchVal}
                onKeyDown={searchDoc}
                class="form-control me-2"
                type="search"
                placeholder="Search"
                aria-label="Search"
                style={{ width: "500px" }}
              />
          </div>
        </div>
      </nav>
      {!searchState && <div>
      <h4 style={{ marginTop: "5%" }}>Start a new document</h4> 
      <div style={{display:"flex"}}>
      <div
              onClick={() => {
                navigate(`/docs/`);
              }}
              class="card"
              style={{ width: "18rem" }}
            >
              <img
                src="https://th.bing.com/th/id/OIP.-lbP1SXgEB-YLX11I15mAQAAAA?rs=1&pid=ImgDetMain"
                class="card-img-top"
                alt="..."
              />
              <div class="card-body">
                <p class="card-text">
                  Blank document
                </p>
              </div>
            </div>
            {
              templates.map((template, index) => (
                <div
                  key={index} 
                  onClick={() => {
                    docContext.setTemplateID(index+1);
                    docContext.setTemplateTitle(template.name);
                    navigate(`/docs/${uniqueId}`);
                  }}
                  className="card" 
                  style={{ width: "18rem" }}
                >
                  <img
                    src={`/assets/templates/${template.name}.png`}
                    className="card-img-top"
                    alt="..."
                  />
                  <div className="card-body">
                    <p className="card-text">
                      {template.name}
                    </p>
                  </div>
                </div>
              ))              
            }
      </div>
      </div>}
      {!searchState && <h4>Recent documents</h4>}
      {searchState && <h4 style={{ marginTop: "5%" }}>Top results</h4>}
      {searchState &&
        <div className="card-container d-flex">
          {searchedDocs.map((item, idx) => (
            <div
              onClick={() => {
                navigate(`/docs/${item.doc_id}`);
              }}
              class="card"
              style={{ width: "18rem" }}
            >
              <img
                src="https://th.bing.com/th/id/OIP.-lbP1SXgEB-YLX11I15mAQAAAA?rs=1&pid=ImgDetMain"
                class="card-img-top"
                alt="..."
              />
              <div class="card-body">
                <p class="card-text">
                  {item === null ? "Untitled document" : item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      }
      {/* {
        (() => {
          for(let i = 0;i<title.length;i++){
            if(i==0 || (i+1)%4==0){
              
            }
          }
        })()
      } */}
      {!searchState &&
        <div className="card-container d-flex">
          {title.map((item, idx) => (
            <div
              onClick={() => {
                navigate(`/docs/${docID[idx]}`);
              }}
              class="card"
              style={{ width: "18rem" }}
            >
              <img
                src="https://th.bing.com/th/id/OIP.-lbP1SXgEB-YLX11I15mAQAAAA?rs=1&pid=ImgDetMain"
                class="card-img-top"
                alt="..."
              />
              <div class="card-body">
                <p class="card-text">
                  {item === null ? "Untitled document" : item}
                </p>
                <p class="card-text">
                  {date[idx]} {time[idx]}
                </p>
              </div>
            </div>
          ))}
        </div>
      }
    </>
  );
}

export default Home;
