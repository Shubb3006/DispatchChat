import multer from "multer";
import path from "path";
import fs from "fs";


const uploadPath = path.join(
    process.cwd(),
    "src",
    "uploads",
    "documents"
);


if(!fs.existsSync(uploadPath)){
    fs.mkdirSync(uploadPath,{
        recursive:true
    });
}



const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        cb(null,uploadPath);

    },


    filename:(req,file,cb)=>{

        const loadNumber = req.params.load_number || "UNKNOWN";

        const ext = path.extname(file.originalname);


        const filename =
        `Load_${loadNumber}_${Date.now()}${ext}`;


        cb(null,filename);

    }

});


export const upload = multer({
    storage
});