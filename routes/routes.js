const express =  require('express');
const router = express.Router();
const User = require('../models/users');
const Signup = require('../models/signupSchema');
const multer = require('multer');
const fs = require('fs');
const { request } = require('https');
const bcrypt = require('bcrypt');
const md5 = require('md5');


  

//image upload
var storage = multer.diskStorage({
   destination:function(req,file,cb){
      cb(null,'./uploads')
   },
   filename: function(req,file,cb){
      cb(null,file.fieldname + "_"+Date.now()+"_"+file.originalname);
   },
});



var upload = multer({
   storage: storage,
}).single("image");


router.post('/add', upload, async (req, res) => {
   try {
    
     const user = new User({
       name: req.body.name,
       email: req.body.email,
       phone: req.body.phone,
       image: req.file.filename,
     });
 
     // Save the user
     await user.save();
 
     req.session.message = {
       type: 'success',
       message: "User added successfully",
     };
 
     res.redirect("/");
    
   } catch (err) {
     res.json({ message: err.message, type: 'danger' });
   }
 });

 router.get("/",(req, res) => {
    res.render('home', { title: 'front' });
});

 //get all users route
router.get("/front", async (req, res) => {
  
   try {
    console.log(req.session.user);
    if (req.session.user) {
     const users = await User.find().exec();
     res.render("index", {
       title: "Home page",
       users: users,
     });
    }
    else{
        res.redirect("/signup");
    }
   } catch (err) {
     res.json({ message: err.message });
   }
 });
 
router.get("/add",(req,res) =>{
    if (req.session.user) {
   res.render('add_users' ,{title: 'Add users'});
    }
    else
    {
        res.redirect("/");
    }
});
//edit an user route
router.get("/edit/:id", async (req, res) => {
   try {
       const id = req.params.id;
       const user = await User.findById(id).exec();
       if (!user) {
           return res.redirect('/');
       }
       res.render("edit_users", {
           title: "Edit User",
           user: user,
       });
   } catch (err) {
       console.error(err);
       res.redirect('/');
   }
});

router.post('/update/:id', upload, async (req, res) => {
   try {
       let id = req.params.id;
       let new_image = '';
       if (req.file) {
           new_image = req.file.filename; // Corrected variable name
           try {
               fs.unlinkSync("./uploads/" + req.body.old_image);
           } catch (err) {
               console.log(err);
           }
       } else {
           new_image = req.body.old_image;
       }

       // Using async/await with try-catch for better error handling
       const updatedUser = await User.findByIdAndUpdate(id, {
           name: req.body.name,
           email: req.body.email,
           phone: req.body.phone,
           image: new_image, // Use the new_image variable here
       }).exec();

       if (updatedUser) {
           req.session.message = {
               type: 'success',
               message: 'User Updated successfully',
           };
           res.redirect('/');
       } else {
           res.json({ message: 'User not found', type: 'danger' });
       }
   } catch (err) {
       res.json({ message: err.message, type: 'danger' });
   }
});

router.get("/signup", (req, res) => {
    res.render('signup', { title: 'Signup' });
});

router.get("/login", (req, res) => {
    res.render('login', { title: 'login' });
});

router.post("/signup", async (req, res) => {
    try {
        
        //const { email,username, password } = req.body;
        
        const password = req.body.password;
        const email = req.body.email;
        const validEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(email);
        if (!validEmail) {
            return res.send(`
              <script>
                alert("Please enter a valid email address ending with '.com'!");
                window.location.href = "/signup";
              </script>
            `);
        }
        if (password.length < 8 || !/[A-Z]/.test(password.charAt(0)) || !/[!@#$%^&*(),.?":{}|<>]/.test(password) || !/\d/.test(password)) {
            return res.send(`
              <script>
                alert("Password should start with a capital letter and contain at least one special character, one number, and a minimum of eight characters!");
                window.location.href = "/signup";
              </script>
            `);
        }
      
        // Create a new user using the signup schema
        const newUser = new Signup({  email: email,
            username: req.body.username,
            password: md5(password) });
            
        await newUser.save();
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.json({ message: err.message, type: 'danger' });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        // Find user using the login schema
        const user = await Signup.findOne({ username });
        if (!user) {
            return res.redirect("/login");
        }
        // Check password using bcrypt
        //const validPassword = await bcrypt.compare(password, user.password);
        if (md5(password ===user.password )) {
            req.session.user = user; // Create a session
            return res.redirect("/front");
        } else {
            return res.redirect("/login");
        }
    } catch (err) {
        console.error(err);
        res.json({ message: err.message, type: 'danger' });
    }
});


//delete user route
router.get('/delete/:id', async (req, res) => {
   let id = req.params.id;
   try {
       let result = await User.findByIdAndDelete(id);
       if (result && result.image) {
           try {
               await fs.promises.unlink('./uploads/' + result.image);
           } catch (err) {
               console.log('Error deleting file:', err);
           }
       }
       req.session.message = {
           type: "info",
           message: "User deleted successfully",
       };
       res.redirect("/");
   } catch (err) {
       res.json({ message: err.message });
   }
});


//logout

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal server error');
      } else {
        res.redirect('/login');
      }
    });
  });
 
module.exports =  router;