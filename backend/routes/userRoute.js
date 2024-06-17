const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logOut, getUserDetails, updateUserProfile, withdrawalRequest, allWithdrawal, getSingleWithdrawal, approveWithdrawal, rejectWithdrawal, getAllUsers, getsingleUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { isAuthenticated, authoriseRoles } = require("../middleware/auth")

// register user
router.post('/register', registerUser);

// login user
router.post('/login', loginUser);

// logout user 
router.get('/logout',logOut)

// get user details
router.get('/profile',isAuthenticated,getUserDetails)

// update user profile
router.put('/update/profile', isAuthenticated, updateUserProfile);

// request for withdrawal
router.post('/withdrawal/request',isAuthenticated,withdrawalRequest);




// --------_________------------______________------------ADMIN_______--------_______----------_______-----------------___________-----------__________




// get All user ---------->by admin
router.get('/admin/users', isAuthenticated, authoriseRoles('admin'), getAllUsers);

// get Single user ----------->by admin
router.get('/admin/user/:id',isAuthenticated,authoriseRoles('admin'),getsingleUsers);

// update user role by admin
router.put('/admin/user/updaterole/:id',isAuthenticated,authoriseRoles('admin'),updateUserRole);

// delete single user by admin
router.delete('/admin/user/delete/:id',isAuthenticated,authoriseRoles('admin'),deleteUser);


// pending withdrawal -------> by admin
router.get('/admin/all-withdrawal', isAuthenticated,authoriseRoles("admin"),allWithdrawal);

// get single withdrawal request   ------> by admin
router.get('/admin/withdrawal/:id',isAuthenticated,authoriseRoles("admin"),getSingleWithdrawal);

// get withdrawal request approve  --------> by admin
router.put('/admin/withdrawal/:id/approve', isAuthenticated, authoriseRoles("admin"),approveWithdrawal);

// get withdrawal request reject ----> by admin
router.put('/admin/withdrawal/:id/reject',isAuthenticated,authoriseRoles("admin"),rejectWithdrawal);



module.exports = router;
