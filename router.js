const express = require('express');
const router = express.Router();
const db  = require('./dbConnection');
const { signupValidation, loginValidation } = require('./validation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// router.post('/register', signupValidation, (req, res, next) => {
//   db.query(
//     `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(
//       req.body.email
//     )});`,
//     (err, result) => {
//       if (result.length) {
//         return res.status(409).send({
//           msg: 'This user is already in use!'
//         });
//       } else {
//         // username is available
//         bcrypt.hash(req.body.password, 10, (err, hash) => {
//           if (err) {
//             return res.status(500).send({
//               msg: err
//             });
//           } else {
//             // has hashed pw => add to database
//             db.query(
//               `INSERT INTO users (name, email, password) VALUES ('${req.body.name}', ${db.escape(
//                 req.body.email
//               )}, ${db.escape(hash)})`,
//               (err, result) => {
//                 if (err) {
//                   throw err;
//                   return res.status(400).send({
//                     msg: err
//                   });
//                 }
//                 return res.status(201).send({
//                   msg: 'The user has been registerd with us!'
//                 });
//               }
//             );
//           }
//         });
//       }
//     }
//   );
// });


router.post('/login', loginValidation, (req, res, next) => {
  db.query(
    `SELECT * FROM tbusers WHERE user_username = ${db.escape(req.body.user_username)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        throw err;
        return res.send({
          msg: err
        });
      }
      if (!result.length) {
        return res.send({
          msg: 'Email or password is incorrect!'
        });
      }
      // check password
      bcrypt.compare(
        req.body.user_passwords,
        result[0]['user_passwords'],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            throw bErr;
            return res.send({
              msg: 'Email or password is incorrect!'
            });
          }
          if (bResult) {
            const token = jwt.sign({user_username:result[0].user_username},'the-super-strong-secrect',{ expiresIn: '1h' });
            // db.query(
            //   `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
            // );
            return res.status(200).send({
              msg: 'Logged in!',
              token,
              user: result[0]
            });
          }
          return res.send({
            msg: 'Username or password is incorrect!'
          });
        }
      );
    }
  );
});

router.get('/get-user', signupValidation, (req, res, next) => {


    if(
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }
    
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, 'the-super-strong-secrect');

    db.query("SELECT a.user_username as user_username , a.user_passwords as user_passwords,CONCAT(b.pre_th_name,a.user_firstname,+' ',a.user_lastname) as name ,a.user_phone as user_phone , a.user_email as user_email ,c.sex_name as sex_name,CONCAT('จังหวัด : ',e.name_th,' อำเภอ : ',r.name_th,' ตำบล : ',y.name_th) as address FROM tbusers as a  INNER JOIN tbprefix as b ON b.prefix_id = a.prefix_id INNER JOIN tbsex as c ON c.sex_id = a.sex_id INNER JOIN provinces as e ON e.province_id = a.province_id INNER JOIN amphures as r ON r.amphure_id = a.amphure_id INNER JOIN districts as y ON y.districts_id = a.districts_id  WHERE a.user_username = ?", decoded.user_username, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Fetch Successfully.' });
    });


});


module.exports = router;
