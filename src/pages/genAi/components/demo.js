// showModel && (
//         <Box
//           title=""
//           sx={{
//             position: "fixed",
//             bottom: "2rem",
//             right: "2rem",
//             maxWidth: "35vw",
//             maxHeight: "80vh",
//             background: "#fff",
//             borderRadius: "8px",
//             boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
//             overflow: "scroll",
//             zIndex: 1300,
//           }}
//           width={"110vh"}
//           footer={null}
//         >
//           <IconButton
//             onClick={() => setShowModel(false)}
//             sx={{
//               position: "absolute",
//               top: "10px",
//               right: "10px",
//               color: "white",
//               backgroundColor: "rgba(0, 0, 0, 0.3)",
//               borderRadius: "50%",
//               padding: "5px",
//               "&:hover": {
//                 backgroundColor: "rgba(0, 0, 0, 0.5)",
//               },
//             }}
//           >
//             <IoMdClose size={24} />
//           </IconButton>

//           <Grid
//             item
//             md={10}
//             padding={"10px"}
//             sx={{
//               width: "100%",
//             }}
//           >
//             <Grid
//               sx={{
//                 background: "#FFF",
//                 width: "100%",
//               }}
//             >
//               <Grid
//                 sx={{
//                   padding: "20px 10px 10px 10px",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "30px",
//                   overflow: "auto",
//                   width: "100%",
//                 }}
//               >
//                 {startChart && (
//                   <div>
//                     {!loading ? (
//                       <div>
//                         <h2 style={{ fontSize: "30px" }}>Data Exploration</h2>
//                         <Tabs
//                           value={currentTab}
//                           onChange={handleTabChange}
//                           sx={{
//                             marginTop: "20px",
//                             marginBottom: "20px",
//                             "& .MuiTabs-flexContainer": {
//                               display: "flex",
//                               flexDirection: "row",
//                             },
//                             "& .MuiTab-root": {
//                               textTransform: "none",
//                               fontSize: "16px",
//                               fontWeight: "400",
//                               lineHeight: "24px",
//                               fontFamily: "Poppins",
//                               background: "#E6EDF5",
//                               color: "#242424",
//                               margin: "4px",
//                               padding: "4px 10px",
//                               ":hover": {
//                                 background: "#E6EDF5",
//                               },
//                             },
//                             "& .Mui-selected": {
//                               backgroundColor: "#3F8CFF !important",
//                               color: "#fff !important",
//                               fontWeight: 700,
//                             },
//                             svg: {
//                               width: 16,
//                               height: 16,
//                             },
//                           }}
//                         >
//                           <Tab label="Text View" />
//                           <Tab label="Graphical View" />
//                         </Tabs>

//                         <div className="explorationSection">
//                           <h2 style={{ fontSize: "30px" }}>Exploration</h2>
//                           <p>Below are the sample questions</p>

//                           <div
//                             className="sampleQuestions"
//                             style={{
//                               display: "flex",
//                               marginBottom: "20px",
//                               flexWrap: "wrap",
//                               flexDirection: "column",
//                               alignItems: "flex-end",
//                             }}
//                           >
//                             {questions?.map((question, index) => (
//                               <SampleQuestion
//                                 key={index}
//                                 question={`${question}`}
//                                 onClick={handleQuestionClick}
//                               />
//                             ))}
//                           </div>
//                           <button
//                             style={{
//                               background: "#f8f9fa",
//                               padding: "8px 12px",
//                               border: "none",
//                               borderRadius: "5px",
//                               cursor: "pointer",
//                               fontSize: "16px",
//                               transition: "background 0.3s ease",
//                               marginBottom: "20px",
//                               color: "black",
//                             }}
//                             onClick={regenerateQuestions}
//                           >
//                             <IoMdRefresh color="blue" /> Re-generate sample
//                             questions
//                           </button>
//                           <p>Type In your question below:</p>
//                           <div
//                             style={{
//                               display: "flex",
//                               justifyContent: "flex-start",
//                               marginTop: "0px",
//                             }}
//                           >
//                             <TextField
//                               onChange={(e) => setSearch(e.target.value)}
//                               variant="outlined"
//                               value={search}
//                               sx={{
//                                 width: "500px",
//                                 "& .MuiOutlinedInput-root:hover fieldset": {
//                                   borderColor: "rgb(69, 69, 69)",
//                                 },
//                                 "& .MuiOutlinedInput-root.Mui-focused fieldset":
//                                   {
//                                     outline: "none",
//                                     boxShadow: "none",
//                                     border: search
//                                       ? "1px solid rgb(48, 36, 139)"
//                                       : "1px solid rgb(69, 69, 69)",
//                                   },
//                                 "& .MuiOutlinedInput-root": {
//                                   paddingRight: "10px",
//                                   height: "45px",
//                                 },
//                               }}
//                               placeholder="Type here to ask Gen AI............."
//                               InputProps={{
//                                 endAdornment: (
//                                   <InputAdornment position="end">
//                                     <IoMdSend
//                                       size={24}
//                                       style={{
//                                         color: search
//                                           ? "rgb(91, 71, 245)"
//                                           : "rgb(142, 139, 157)",
//                                         cursor: "pointer",
//                                       }}
//                                       onClick={() => {
//                                         handleQuestionClick(search);
//                                         setSearch("");
//                                       }}
//                                     />
//                                   </InputAdornment>
//                                 ),
//                               }}
//                             />
//                           </div>
//                           <div
//                             className="answersSection"
//                             style={{
//                               marginTop: "20px",
//                               display: "flex",
//                               flexDirection: "column",
//                               gap: "20px",
//                             }}
//                           >
//                             <div
//                               style={{
//                                 display: "flex",
//                                 justifyContent: "space-between",
//                                 marginBottom: "10px",
//                               }}
//                             >
//                               <h2 style={{ fontSize: "30px" }}>Answers</h2>
//                               <button
//                                 className="btn btn-primary"
//                                 onClick={() => setAnswers([])}
//                               >
//                                 Reset
//                               </button>
//                             </div>
//                             {answers?.map((item, index) => (
//                               <div
//                                 key={index}
//                                 style={{
//                                   display: "flex",
//                                   justifyContent: "space-between",
//                                   flexDirection: "row",
//                                   alignItems: "flex-start",
//                                 }}
//                               >
//                                 <div
//                                   style={{
//                                     maxWidth: "60%",
//                                     marginRight: "20px",
//                                     backgroundColor: "#f1f1f1",
//                                     borderRadius: "8px",
//                                     padding: "10px",
//                                   }}
//                                 >
//                                   <AnswersChat
//                                     question={item.question}
//                                     answer={item.answer}
//                                     loading={item?.loading}
//                                     type={item.view}
//                                     name={"genbi"}
//                                   />
//                                 </div>
//                                 <div
//                                   style={{
//                                     maxWidth: "30%",
//                                     backgroundColor: "#e6e6e6",
//                                     borderRadius: "8px",
//                                     padding: "10px",
//                                   }}
//                                 >
//                                   <div
//                                     style={{
//                                       textAlign: "right",
//                                     }}
//                                   >
//                                     {item.question}
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     ) : (
//                       <div
//                         style={{
//                           display: "flex",
//                           width: "100%",
//                           justifyContent: "center",
//                         }}
//                       >
//                         <CircularProgress />
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </Grid>
//             </Grid>
//           </Grid>
//         </Box>
//       )



