// import multer from "multer";
// import path from "path";
// import fs from "fs";


// const uploadPath = path.join(
//     process.cwd(),
//     "src",
//     "uploads",
//     "documents"
// );


// if(!fs.existsSync(uploadPath)){
//     fs.mkdirSync(uploadPath,{
//         recursive:true
//     });
// }



// const storage = multer.diskStorage({

//     destination:(req,file,cb)=>{

//         cb(null,uploadPath);

//     },


//     filename:(req,file,cb)=>{
//         console.log(req.params)

//         const loadNumber = req.params.load_number || "UNKNOWN";

//         const ext = path.extname(file.originalname);


//         const filename =
//         `Load_${loadNumber}_${Date.now()}${ext}`;


//         cb(null,filename);

//     }

// });


// export const upload = multer({
//     storage
// });


import multer from 'multer';

// Keep file in memory RAM temporarily so we can stream it straight to the cloud
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});