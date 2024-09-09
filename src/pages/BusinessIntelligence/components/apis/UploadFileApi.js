import { db } from "../../firebaseConfig";
import { collection,addDoc } from "firebase/firestore";
import Papa from 'papaparse';

export const collectionRef = collection(db,"data")


export const handleUpload = (file) => {
    if (file) {
        console.log(file)
      const reader = new FileReader();
      reader.onload = () => {
        const csvData = reader.result;
        // Parse the CSV data using PapaParse
        const parsedData = Papa.parse(csvData, { header: true });
        parsedData.data.forEach((item) => {
addDoc(collectionRef,item).then((res)=>{
console.log(res)
}).catch((err)=>{
console.log(err)
})
});
      };
      reader.readAsText(file);
    }
  };





// console.log(data)
// const res = await fetch("https://fakestoreapi.com/products")
// const data = await res.json() 

// const data = snapshot.docs.map(doc => doc.data());


