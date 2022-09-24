const services = { // Services
    /**
     * HELP
     * ROUTE_NAME: {
     *     path: must be string, path authenticated based on it if no pathRegex defined, else doesn't count at all
     *     pathRegex: string|regex, path authenticated based on it
     *     label: if defined will appear as a service with this label in "main" page, also value could have been used directly in code
     *     sidePaths: [string|regex], act as second to pathRegex|path, also value could have been used directly in code
     *     methods: [string], if defined will filter requests based on these methods, else all methods are accepted
     *     pathRef: only a value for reference
     *     label2: only a value for reference
     *     labelPerRole: {ROLE_NAME: ROLE_SPECIFIC_LABEL} overrides "label" for a role
     * }
     */
    Users: {
        USERS_LOGIN: {
            path: "/users/login",
        },
        USERS_LOGOUT: {
            path: "/users/logout",
        },
        USERS_REGISTRATION: {
            path: "/users/register",
        },
        USERS_MAIN: {
            path: "/users/main",
        },
        USERS_CHANGE_PASS: {
            path: "/users/change-pass",
        },
        USERS_MANAGEMENT: {
            path: "/users/manage",
            label: "users_management",
        },
        USERS_NEW_USER: {
            path: "/users/new-user",
        },
        USERS_EDIT_USER: {
            path: "/users/edit-user",
        },
        USERS_GET_ALL: {
            path: "/users/list",
        },
        USERS_QUERY: {
            path: "/users/q",
        },
        USERS_DEACTIVATE: {
            path: "/users/deactivate",
        },
        USERS_RESET_PASSWORD: {
            path: "/users/reset-password",
        },
        USERS_FORGOT_PASSWORD: {
            path: "/users/forgot-password",
        },
    },
    Misc: {},
}
let s = {}
for (let sKey in services) {
    for (let innerKey in services[sKey]) {
        if (services[sKey][innerKey].sidePaths === undefined) {
            services[sKey][innerKey].sidePaths = []
        }
    }
    s = {...s, ...services[sKey]}
}
global._Routes = s

module.exports = s