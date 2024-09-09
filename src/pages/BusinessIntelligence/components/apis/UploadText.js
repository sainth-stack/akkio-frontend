import { db } from "../../firebaseConfig";
import { addDoc, onSnapshot, collection, } from "firebase/firestore";

const promptRef = collection(db,"prompts")


export const uploadText=(data)=>{
addDoc(promptRef,{prompt:data}).then((res)=>{
console.log(res)
})
}


export const getPrompts = (setPrompts)=>{
    onSnapshot(promptRef,(res)=>{
setPrompts(
    res.docs.map((doc)=>{
return {
    ...doc.data(),id:doc.id
}
    })
)
    })

}