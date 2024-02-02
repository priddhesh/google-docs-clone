import { useState } from "react";
import DocContext from "./DocContext";

const DocState = (props)=>{
   const [docOwner,setDocOwner] = useState("");
   const [docID,setDocID] = useState("");
   const [templateID,setTemplateID] = useState("");
   const [templateTitle,setTemplateTitle] = useState("");
   const [version,setVersion] = useState(false);

   return(
    <DocContext.Provider value={{docOwner, docID,setDocOwner,setDocID,templateID,setTemplateID,templateTitle,setTemplateTitle,version,setVersion}}>
        {props.children}
    </DocContext.Provider>
   )
}

export default DocState;