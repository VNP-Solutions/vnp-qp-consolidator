/* ============================================================
   Static lookup tables for single-letter QP response codes.
   Each entry: { variant, reason }
   - variant: maps to a .cell-badge variant — 'success' | 'warning' | 'danger' | 'neutral'
   - reason:  full human-readable explanation shown in the tooltip
   ============================================================ */
window.QP_CODES = {
    AVS: {
        X: {
            variant: 'success',
            reason: 'Exact Match — Both the street address and the 9-digit ZIP code match.',
        },
        Y: {
            variant: 'success',
            reason: 'Full Match — Street address and 5-digit ZIP code match.',
        },
        A: {
            variant: 'warning',
            reason: 'Partial Match — Street address matches, but the ZIP code does not.',
        },
        W: {
            variant: 'warning',
            reason: 'Partial Match — 9-digit ZIP code matches, but the street address does not.',
        },
        Z: {
            variant: 'warning',
            reason: 'Partial Match — 5-digit ZIP code matches, but the street address does not.',
        },
        N: {
            variant: 'danger',
            reason: 'No Match — Neither the street address nor the ZIP code matches.',
        },
        U: {
            variant: 'neutral',
            reason: 'Unavailable — Address information is unavailable or the bank does not support AVS.',
        },
        R: {
            variant: 'warning',
            reason: 'Retry — System is unavailable; try the transaction again later.',
        },
        E: {
            variant: 'danger',
            reason: 'Error — AVS data is invalid or a system error occurred.',
        },
        S: {
            variant: 'neutral',
            reason: 'Service Not Supported — The issuing bank does not support AVS.',
        },
    },
    ENTRY: {
        API: {
            variant: 'info',
            reason: 'This transaction was completed by automated API.',
        },
        KEYED: {
            variant: 'accent',
            reason: 'This transaction was completed by manual resource / desktop automation.',
        },
    },
    CSC: {
        M: {
            variant: 'success',
            reason: "Match — The security code entered matches the bank's records exactly.",
        },
        N: {
            variant: 'danger',
            reason: "No Match — The security code entered does not match the bank's records.",
        },
        P: {
            variant: 'warning',
            reason: 'Not Processed — Verification was not processed by the payment network or the bank, usually due to a temporary system error or network unavailability.',
        },
        S: {
            variant: 'warning',
            reason: 'Not Present — The security code should be on the card, but the merchant indicated on the request that the value was not present or left blank.',
        },
        U: {
            variant: 'neutral',
            reason: 'Issuer Not Certified — The issuing bank does not participate in the security code validation program or has not provided encryption keys to the network.',
        },
    },
};