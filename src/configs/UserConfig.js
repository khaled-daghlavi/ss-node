const status = {
    TEMP_PASS: 'TEMP_PASS',
    USER_ASSIGNED_PASS: 'USER_ASSIGNED_PASS',
    DEACTIVE: 'DEACTIVE',
    RESET_PASSWORD: 'RESET_PASSWORD',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD',
}
_RefVals.User = {
    status,
    EnforcePasswordChangeOnStatuses: [
        status.TEMP_PASS,
        status.RESET_PASSWORD,
        status.FORGOT_PASSWORD,
    ],
}