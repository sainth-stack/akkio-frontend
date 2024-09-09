import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import { generateResponse } from '../apis/OpenAiApi'
import {BsSendFill} from "react-icons/bs"
import { uploadText } from '../apis/UploadText'
import { Input,Radio } from 'antd'
import Prompts from './Prompts'
import { Spin } from 'antd';
// import { getPrompts } from '../apis/UploadText'
import moment from 'moment'


const Explore = () => {

const [inputValue, setInputValue] = useState("")
const [generative, setGenerative] = useState("")
const [tableData, setTableData] = useState([])
const [text,setText] = useState("")
const [prompts, setPrompts] = useState([])
const [results, setResults] = useState([])
const [update, setUpdate] = useState(false)


// setText(`${generative?generative:""}`)


useEffect(()=>{
// console.log(prompts)
setTimeout(()=>{
  console.log(results,"Yes")
},1000)
},[update])

 // Function to access the value from an input field
const handleInput = (e)=>{
setInputValue(e.target.value)
    }


    const handleSubmit = ()=>{
        console.log("Submitted")
        console.log(inputValue)
        // uploadText(inputValue)
        const time= moment().format("LT")
  setPrompts([...prompts,{prompt:inputValue,time:time}])
  localStorage.setItem("prompts",JSON.stringify(prompts))
setTableData(JSON.parse(localStorage.getItem("tableData")))


tableData.map(async(data,index)=>{
if(inputValue.includes(data.Date)){
// setText(`The TagName on the ${data.Date} is ${data.TAGNAME}`)
setResults([...results,{
prompt:inputValue,
output:`The Tagname on ${data.Date} is ${data.TAGNAME}.\nThe Light House is ${data.VALUE} on that day.\n
The Sunangle is ${(Math.round(data.SUNANGLE*100)/100).toFixed(2)}\n
The data is of ${data.Location} location.`,
uploadTime:time,
  // tagname: data.TAGNAME,
  // data:data.Date,
  // value:data.VALUE,
  // sunangle:data.SUNANGLE,
  // latitude: data.Latitude,
  // longtude: data.Longitude,
  // location:data.Location,
  // pressure:data.Pressure,
  // time:data.Time
}])
setUpdate(!update)
}
else if(inputValue.includes(data.Date) ===false && results[results.length-1]?.prompt !== inputValue){
 generateResponse(inputValue).then((res)=>{
    console.log(res)
setResults([...results,{
  prompt:inputValue,
uploadTime:time,
output:res
}])
setUpdate(!update)
    })
    .catch((err)=>{
    console.log(err)
    })
}

})
// console.log(results,"Hi")
setInputValue("")
// const lines = text.split('\n');

    }

  return (
<>
<Navbar/>
<div className="explore-section">
<h2>Chat Explore</h2>
{/* <br /> */}

    <hr className='hrElm' />
<br />
  <div className="prompts">
{
 results.map((field,index)=>{
return <>
<Prompts prompt={field.prompt} time={field.uploadTime} user={"user"} key={index} />
<Prompts prompt={field?.output ? field.output : <Spin/>} time={field.uploadTime} user={"DigiotAI"} key={(index + 100)}/>
{console.log(field.prompt,field.uploadTime,field.ouput)}
</>
  })
}
</div>

<div className="explore-container">
<Input placeholder="Ask about your dataset" className='input'  value={inputValue} onChange={(e)=>handleInput(e)} />

<button className='btn btn-primary px-2.5 py-2' onClick={()=>{ 
    handleSubmit()
}} disabled={inputValue?false:true} ><BsSendFill size={20}/></button>
{/* {lines.map((line, index) => (
        <span key={index}>
          {line}
     </span>
      ))} */}
</div>
{/* <p className='output-text'>{text}</p> */}
</div>

</>
  )
}

export default Explore