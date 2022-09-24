const s = require('./RoutesConfig')

_RefVals.Roles = {
    AuthenticatedServices: [s.USERS_MAIN, s.USERS_LOGOUT, s.USERS_CHANGE_PASS],
    EveryoneButTheCustomerServices: []
}

global._Roles = {
    ADMIN: {
        name: "ADMIN",
        services: [s.USERS_MANAGEMENT, s.USERS_NEW_USER, s.USERS_GET_ALL, s.USERS_DEACTIVATE, s.USERS_RESET_PASSWORD, s.USERS_EDIT_USER,
                   s.USERS_QUERY],
    },
    OPERATOR: {
        name: "OPERATOR",
        services: [s.USERS_MANAGEMENT, s.USERS_NEW_USER, s.USERS_GET_ALL, s.USERS_EDIT_USER,
                   s.USERS_QUERY,],
    },
    SALES_DIRECTOR: {
        name: "SALES_DIRECTOR",
        services: [s.USERS_QUERY],
    },
    FINANCE: {
        name: "FINANCE",
        services: [],
    },
    MANAGER: {
        name: "MANAGER",
        services: [],
    },
    CUSTOMER: {
        name: "CUSTOMER",
        services: [],
    },
}
