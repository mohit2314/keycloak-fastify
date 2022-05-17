const { default: axios } = require('axios');

const keycloakAuthOpts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                client_secret: { type: 'string' },
                grant_type: { type: 'string' },
                client_id: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }
    }
}
const userOpts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }
    }
}

const createUserOpts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                // createdTimestamp: { type: 'number' },
                // username: { type: 'string' },
                // enabled: { type: 'boolean' },
                // totp: { type: 'boolean' },
                // emailVerified: { type: 'boolean' },
                // firstName: { type: 'string' },
                // lastName: { type: 'string' },
                email: { type: 'string' },
                // disableableCredentialTypes: { type: 'array' },
                // requiredActions: { type: 'array' },
                // notBefore: { type: 'number' },
                // access: {
                //     manageGroupMembership: { type: 'boolean' },
                //     view: { type: 'boolean' },
                //     mapRoles: { type: 'boolean' },
                //     impersonate: { type: 'boolean' },
                //     manage: { type: 'boolean' }
                // }
            }
        },
        response: {
            //     // 200: userObj 
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }

    }
}

// ----------------------------

function keycloakRoutes(fastify, options, done) {
    var access_token_stored = '';
    //get access token
    fastify.post('/getAccessToken', keycloakAuthOpts, async function (req, reply) {
        const { client_secret, grant_type, client_id } = req.body
        try {
            const {
                data: { access_token }, } = await axios({
                    method: "POST",
                    url: `http://localhost:8080/realms/myRealm/protocol/openid-connect/token`,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    data: `client_secret=${client_secret}&grant_type=${grant_type}&client_id=${client_id}`
                });
            access_token_stored = access_token
            console.log("API RESPONES", access_token);
            reply.send({ message: `Access Token for client ${client_id} is ${access_token}` })
        } catch (err) { }
    })

    // Check if user exists with email
    fastify.post('/createUserWithEmail', userOpts, async function (req, reply) {
        const { email } = req.body
        if (validateEmail(email)) {
            //If email valid
            let emailExists = null;
            let userResponse = [];
            try {
                userResponse = await axios({
                    method: "GET",
                    url: `http://localhost:8080/admin/realms/myRealm/users?email=${email}`,
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${access_token_stored}` },
                });
                console.log("USER RESPONSE", userResponse)
                if (userResponse.data.length>0) {
                    reply.send({ message: `User already exist with this email ${email} ${userResponse}` })
                }
                //User with this email does not exist
                //Create user with this email 
                else {
                   let newUser = await axios({
                        method: "POST",
                        url: `http://localhost:8080/admin/realms/myRealm/users`,
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${access_token_stored}` },
                        data: {"username":`${email.split('@')[0]}`,  "email": `${email}` }
                    });
                    reply.send({ message: `New user created with this email ${email} New User ${newUser.data}`  })

                }

            } catch (error) {
                console.log(error.response.message);
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
                reply.send({ message: `Error data ${error.response.data} Error Msg: ${error.response.message} Error Status: ${error.response.status} Error Header: ${error.response.headers}` })
            }

        }
        else {
            reply.send({ message: 'EMail not valid' })
        }
    })
    function validateEmail(email) {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };
    done()
}

module.exports = keycloakRoutes