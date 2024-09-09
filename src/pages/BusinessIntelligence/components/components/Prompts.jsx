import React from 'react'

const Prompts = ({prompt,time,user}) => {
  return (
    <>
    <div className="prompts-section">
    <div className="prompt-detail">
      <span>{user}</span>
      <span>{time}</span>
      {console.log(time)}
    </div>
    <div className="prompt-container">
{prompt}
</div>
</div>
    </>

  )
}

export default Prompts