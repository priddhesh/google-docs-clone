import { useState } from "react";
import DocContext from "./DocContext";

const DocState = (props)=>{
   const [docOwner,setDocOwner] = useState("");
   const [docID,setDocID] = useState("");
   return(
    <DocContext.Provider value={{docOwner, docID,setDocOwner,setDocID}}>
        {props.children}
    </DocContext.Provider>
   )
}

export default DocState;