# stripe-mcp MCP Server

Auto-generated from OpenAPI spec by `forge-skill-from-openapi --target=mcp-server`.
Transport: **stdio**

> **NOTE: Pruning recommended.** This MCP server exposes all 587 Stripe tools (414 paths). Registering the full server will surface every Stripe endpoint to Claude, creating noise. Consider pruning `src/index.ts` to retain only the 30-50 tools relevant to your app (PaymentIntents, Customers, Subscriptions, Invoices, Products, Prices, Webhooks, Checkout Sessions) before deploying.

## Tools (587)

- `GetAccount` — Retrieve account
- `PostAccountLinks` — Create an account link
- `PostAccountSessions` — Create an Account Session
- `GetAccounts` — List all connected accounts
- `PostAccounts` — <p>With <a href="/docs/connect">Connect</a>, you can create Stripe accounts for your users.
To do this, you’ll first need to <a href="https://dashboard.stripe.com/account/applications/settings">register your platform</a>.</p>

<p>If you’ve already collected information for your connected accounts, you <a href="/docs/connect/best-practices#onboarding">can prefill that information</a> when
creating the account. Connect Onboarding won’t ask for the prefilled information during account onboarding.
You can prefill any information on the account.</p>
- `GetAccountsAccount` — Retrieve account
- `PostAccountsAccount` — Update an account
- `DeleteAccountsAccount` — Delete an account
- `PostAccountsAccountBankAccounts` — Create an external account
- `GetAccountsAccountBankAccountsId` — Retrieve an external account
- `PostAccountsAccountBankAccountsId` — <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
a connected account and optionally sets it as the default for its currency. Other bank account
details are not editable by design.</p>

<p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

<p>You can re-enable a disabled bank account by performing an update call without providing any
arguments or changes.</p>
- `DeleteAccountsAccountBankAccountsId` — Delete an external account
- `GetAccountsAccountCapabilities` — List all account capabilities
- `GetAccountsAccountCapabilitiesCapability` — Retrieve an Account Capability
- `PostAccountsAccountCapabilitiesCapability` — Update an Account Capability
- `GetAccountsAccountExternalAccounts` — List all external accounts
- `PostAccountsAccountExternalAccounts` — Create an external account
- `GetAccountsAccountExternalAccountsId` — Retrieve an external account
- `PostAccountsAccountExternalAccountsId` — <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
a connected account and optionally sets it as the default for its currency. Other bank account
details are not editable by design.</p>

<p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

<p>You can re-enable a disabled bank account by performing an update call without providing any
arguments or changes.</p>
- `DeleteAccountsAccountExternalAccountsId` — Delete an external account
- `PostAccountsAccountLoginLinks` — Create a login link
- `GetAccountsAccountPeople` — List all persons
- `PostAccountsAccountPeople` — Create a person
- `GetAccountsAccountPeoplePerson` — Retrieve a person
- `PostAccountsAccountPeoplePerson` — Update a person
- `DeleteAccountsAccountPeoplePerson` — Delete a person
- `GetAccountsAccountPersons` — List all persons
- `PostAccountsAccountPersons` — Create a person
- `GetAccountsAccountPersonsPerson` — Retrieve a person
- `PostAccountsAccountPersonsPerson` — Update a person
- `DeleteAccountsAccountPersonsPerson` — Delete a person
- `PostAccountsAccountReject` — Reject an account
- `GetApplePayDomains` — <p>List apple pay domains.</p>
- `PostApplePayDomains` — <p>Create an apple pay domain.</p>
- `GetApplePayDomainsDomain` — <p>Retrieve an apple pay domain.</p>
- `DeleteApplePayDomainsDomain` — <p>Delete an apple pay domain.</p>
- `GetApplicationFees` — List all application fees
- `GetApplicationFeesFeeRefundsId` — Retrieve an application fee refund
- `PostApplicationFeesFeeRefundsId` — Update an application fee refund
- `GetApplicationFeesId` — Retrieve an application fee
- `PostApplicationFeesIdRefund` — 
- `GetApplicationFeesIdRefunds` — List all application fee refunds
- `PostApplicationFeesIdRefunds` — Create an application fee refund
- `GetAppsSecrets` — List secrets
- `PostAppsSecrets` — Set a Secret
- `PostAppsSecretsDelete` — Delete a Secret
- `GetAppsSecretsFind` — Find a Secret
- `GetBalance` — Retrieve balance
- `GetBalanceHistory` — List all balance transactions
- `GetBalanceHistoryId` — Retrieve a balance transaction
- `GetBalanceSettings` — Retrieve balance settings
- `PostBalanceSettings` — Update balance settings
- `GetBalanceTransactions` — List all balance transactions
- `GetBalanceTransactionsId` — Retrieve a balance transaction
- `GetBillingAlerts` — List billing alerts
- `PostBillingAlerts` — Create a billing alert
- `GetBillingAlertsId` — Retrieve a billing alert
- `PostBillingAlertsIdActivate` — Activate a billing alert
- `PostBillingAlertsIdArchive` — Archive a billing alert
- `PostBillingAlertsIdDeactivate` — Deactivate a billing alert
- `GetBillingCreditBalanceSummary` — Retrieve the credit balance summary for a customer
- `GetBillingCreditBalanceTransactions` — List credit balance transactions
- `GetBillingCreditBalanceTransactionsId` — Retrieve a credit balance transaction
- `GetBillingCreditGrants` — List credit grants
- `PostBillingCreditGrants` — Create a credit grant
- `GetBillingCreditGrantsId` — Retrieve a credit grant
- `PostBillingCreditGrantsId` — Update a credit grant
- `PostBillingCreditGrantsIdExpire` — Expire a credit grant
- `PostBillingCreditGrantsIdVoid` — Void a credit grant
- `PostBillingMeterEventAdjustments` — Create a billing meter event adjustment
- `PostBillingMeterEvents` — Create a billing meter event
- `GetBillingMeters` — List billing meters
- `PostBillingMeters` — Create a billing meter
- `GetBillingMetersId` — Retrieve a billing meter
- `PostBillingMetersId` — Update a billing meter
- `PostBillingMetersIdDeactivate` — Deactivate a billing meter
- `GetBillingMetersIdEventSummaries` — List billing meter event summaries
- `PostBillingMetersIdReactivate` — Reactivate a billing meter
- `GetBillingPortalConfigurations` — List portal configurations
- `PostBillingPortalConfigurations` — Create a portal configuration
- `GetBillingPortalConfigurationsConfiguration` — Retrieve a portal configuration
- `PostBillingPortalConfigurationsConfiguration` — Update a portal configuration
- `PostBillingPortalSessions` — Create a portal session
- `GetCharges` — List all charges
- `PostCharges` — <p>This method is no longer recommended—use the <a href="/docs/api/payment_intents">Payment Intents API</a>
to initiate a new payment instead. Confirmation of the PaymentIntent creates the <code>Charge</code>
object used to request payment.</p>
- `GetChargesSearch` — Search charges
- `GetChargesCharge` — Retrieve a charge
- `PostChargesCharge` — Update a charge
- `PostChargesChargeCapture` — Capture a payment
- `GetChargesChargeDispute` — <p>Retrieve a dispute for a specified charge.</p>
- `PostChargesChargeDispute` — 
- `PostChargesChargeDisputeClose` — 
- `PostChargesChargeRefund` — Create a refund
- `GetChargesChargeRefunds` — List all refunds
- `PostChargesChargeRefunds` — Create customer balance refund
- `GetChargesChargeRefundsRefund` — <p>Retrieves the details of an existing refund.</p>
- `PostChargesChargeRefundsRefund` — <p>Update a specified refund.</p>
- `GetCheckoutSessions` — List all Checkout Sessions
- `PostCheckoutSessions` — Create a Checkout Session
- `GetCheckoutSessionsSession` — Retrieve a Checkout Session
- `PostCheckoutSessionsSession` — Update a Checkout Session
- `PostCheckoutSessionsSessionExpire` — Expire a Checkout Session
- `GetCheckoutSessionsSessionLineItems` — Retrieve a Checkout Session's line items
- `GetClimateOrders` — List orders
- `PostClimateOrders` — Create an order
- `GetClimateOrdersOrder` — Retrieve an order
- `PostClimateOrdersOrder` — Update an order
- `PostClimateOrdersOrderCancel` — Cancel an order
- `GetClimateProducts` — List products
- `GetClimateProductsProduct` — Retrieve a product
- `GetClimateSuppliers` — List suppliers
- `GetClimateSuppliersSupplier` — Retrieve a supplier
- `GetConfirmationTokensConfirmationToken` — Retrieve a ConfirmationToken
- `GetCountrySpecs` — List Country Specs
- `GetCountrySpecsCountry` — Retrieve a Country Spec
- `GetCoupons` — List all coupons
- `PostCoupons` — Create a coupon
- `GetCouponsCoupon` — Retrieve a coupon
- `PostCouponsCoupon` — Update a coupon
- `DeleteCouponsCoupon` — Delete a coupon
- `GetCreditNotes` — List all credit notes
- `PostCreditNotes` — Create a credit note
- `GetCreditNotesPreview` — Preview a credit note
- `GetCreditNotesPreviewLines` — Retrieve a credit note preview's line items
- `GetCreditNotesCreditNoteLines` — Retrieve a credit note's line items
- `GetCreditNotesId` — Retrieve a credit note
- `PostCreditNotesId` — Update a credit note
- `PostCreditNotesIdVoid` — Void a credit note
- `PostCustomerSessions` — Create a Customer Session
- `GetCustomers` — List all customers
- `PostCustomers` — Create a customer
- `GetCustomersSearch` — Search customers
- `GetCustomersCustomer` — Retrieve a customer
- `PostCustomersCustomer` — Update a customer
- `DeleteCustomersCustomer` — Delete a customer
- `GetCustomersCustomerBalanceTransactions` — List customer balance transactions
- `PostCustomersCustomerBalanceTransactions` — Create a customer balance transaction
- `GetCustomersCustomerBalanceTransactionsTransaction` — Retrieve a customer balance transaction
- `PostCustomersCustomerBalanceTransactionsTransaction` — Update a customer credit balance transaction
- `GetCustomersCustomerBankAccounts` — List all bank accounts
- `PostCustomersCustomerBankAccounts` — Create a card
- `GetCustomersCustomerBankAccountsId` — Retrieve a bank account
- `PostCustomersCustomerBankAccountsId` — <p>Update a specified source for a given customer.</p>
- `DeleteCustomersCustomerBankAccountsId` — Delete a customer source
- `PostCustomersCustomerBankAccountsIdVerify` — Verify a bank account
- `GetCustomersCustomerCards` — List all cards
- `PostCustomersCustomerCards` — Create a card
- `GetCustomersCustomerCardsId` — Retrieve a card
- `PostCustomersCustomerCardsId` — <p>Update a specified source for a given customer.</p>
- `DeleteCustomersCustomerCardsId` — Delete a customer source
- `GetCustomersCustomerCashBalance` — Retrieve a cash balance
- `PostCustomersCustomerCashBalance` — Update a cash balance's settings
- `GetCustomersCustomerCashBalanceTransactions` — List cash balance transactions
- `GetCustomersCustomerCashBalanceTransactionsTransaction` — Retrieve a cash balance transaction
- `GetCustomersCustomerDiscount` — 
- `DeleteCustomersCustomerDiscount` — Delete a customer discount
- `PostCustomersCustomerFundingInstructions` — Create or retrieve funding instructions for a customer cash balance
- `GetCustomersCustomerPaymentMethods` — List a Customer's PaymentMethods
- `GetCustomersCustomerPaymentMethodsPaymentMethod` — Retrieve a Customer's PaymentMethod
- `GetCustomersCustomerSources` — <p>List sources for a specified customer.</p>
- `PostCustomersCustomerSources` — Create a card
- `GetCustomersCustomerSourcesId` — <p>Retrieve a specified source for a given customer.</p>
- `PostCustomersCustomerSourcesId` — <p>Update a specified source for a given customer.</p>
- `DeleteCustomersCustomerSourcesId` — Delete a customer source
- `PostCustomersCustomerSourcesIdVerify` — Verify a bank account
- `GetCustomersCustomerSubscriptions` — List active subscriptions
- `PostCustomersCustomerSubscriptions` — Create a subscription
- `GetCustomersCustomerSubscriptionsSubscriptionExposedId` — Retrieve a subscription
- `PostCustomersCustomerSubscriptionsSubscriptionExposedId` — Update a subscription on a customer
- `DeleteCustomersCustomerSubscriptionsSubscriptionExposedId` — Cancel a subscription
- `GetCustomersCustomerSubscriptionsSubscriptionExposedIdDiscount` — 
- `DeleteCustomersCustomerSubscriptionsSubscriptionExposedIdDiscount` — Delete a customer discount
- `GetCustomersCustomerTaxIds` — List all Customer tax IDs
- `PostCustomersCustomerTaxIds` — Create a Customer tax ID
- `GetCustomersCustomerTaxIdsId` — Retrieve a Customer tax ID
- `DeleteCustomersCustomerTaxIdsId` — Delete a Customer tax ID
- `GetDisputes` — List all disputes
- `GetDisputesDispute` — Retrieve a dispute
- `PostDisputesDispute` — Update a dispute
- `PostDisputesDisputeClose` — Close a dispute
- `GetEntitlementsActiveEntitlements` — List all active entitlements
- `GetEntitlementsActiveEntitlementsId` — Retrieve an active entitlement
- `GetEntitlementsFeatures` — List all features
- `PostEntitlementsFeatures` — Create a feature
- `GetEntitlementsFeaturesId` — Retrieve a feature
- `PostEntitlementsFeaturesId` — Updates a feature
- `PostEphemeralKeys` — Create an ephemeral key
- `DeleteEphemeralKeysKey` — Immediately invalidate an ephemeral key
- `GetEvents` — List all events
- `GetEventsId` — Retrieve an event
- `GetExchangeRates` — List all exchange rates
- `GetExchangeRatesRateId` — Retrieve an exchange rate
- `PostExternalAccountsId` — <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
a connected account and optionally sets it as the default for its currency. Other bank account
details are not editable by design.</p>

<p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

<p>You can re-enable a disabled bank account by performing an update call without providing any
arguments or changes.</p>
- `GetFileLinks` — List all file links
- `PostFileLinks` — Create a file link
- `GetFileLinksLink` — Retrieve a file link
- `PostFileLinksLink` — Update a file link
- `GetFiles` — List all files
- `PostFiles` — Create a file
- `GetFilesFile` — Retrieve a file
- `GetFinancialConnectionsAccounts` — List Accounts
- `GetFinancialConnectionsAccountsAccount` — Retrieve an Account
- `PostFinancialConnectionsAccountsAccountDisconnect` — Disconnect an Account
- `GetFinancialConnectionsAccountsAccountOwners` — List Account Owners
- `PostFinancialConnectionsAccountsAccountRefresh` — Refresh Account data
- `PostFinancialConnectionsAccountsAccountSubscribe` — Subscribe to data refreshes for an Account
- `PostFinancialConnectionsAccountsAccountUnsubscribe` — Unsubscribe from data refreshes for an Account
- `PostFinancialConnectionsSessions` — Create a Session
- `GetFinancialConnectionsSessionsSession` — Retrieve a Session
- `GetFinancialConnectionsTransactions` — List Transactions
- `GetFinancialConnectionsTransactionsTransaction` — Retrieve a Transaction
- `GetForwardingRequests` — List all ForwardingRequests
- `PostForwardingRequests` — Create a ForwardingRequest
- `GetForwardingRequestsId` — Retrieve a ForwardingRequest
- `GetIdentityVerificationReports` — List VerificationReports
- `GetIdentityVerificationReportsReport` — Retrieve a VerificationReport
- `GetIdentityVerificationSessions` — List VerificationSessions
- `PostIdentityVerificationSessions` — Create a VerificationSession
- `GetIdentityVerificationSessionsSession` — Retrieve a VerificationSession
- `PostIdentityVerificationSessionsSession` — Update a VerificationSession
- `PostIdentityVerificationSessionsSessionCancel` — Cancel a VerificationSession
- `PostIdentityVerificationSessionsSessionRedact` — Redact a VerificationSession
- `GetInvoicePayments` — List all payments for an invoice
- `GetInvoicePaymentsInvoicePayment` — Retrieve an InvoicePayment
- `GetInvoiceRenderingTemplates` — List all invoice rendering templates
- `GetInvoiceRenderingTemplatesTemplate` — Retrieve an invoice rendering template
- `PostInvoiceRenderingTemplatesTemplateArchive` — Archive an invoice rendering template
- `PostInvoiceRenderingTemplatesTemplateUnarchive` — Unarchive an invoice rendering template
- `GetInvoiceitems` — List all invoice items
- `PostInvoiceitems` — Create an invoice item
- `GetInvoiceitemsInvoiceitem` — Retrieve an invoice item
- `PostInvoiceitemsInvoiceitem` — Update an invoice item
- `DeleteInvoiceitemsInvoiceitem` — Delete an invoice item
- `GetInvoices` — List all invoices
- `PostInvoices` — Create an invoice
- `PostInvoicesCreatePreview` — Create a preview invoice
- `GetInvoicesSearch` — Search invoices
- `GetInvoicesInvoice` — Retrieve an invoice
- `PostInvoicesInvoice` — Update an invoice
- `DeleteInvoicesInvoice` — Delete a draft invoice
- `PostInvoicesInvoiceAddLines` — Bulk add invoice line items
- `PostInvoicesInvoiceAttachPayment` — Attach a payment to an Invoice
- `PostInvoicesInvoiceFinalize` — Finalize an invoice
- `GetInvoicesInvoiceLines` — Retrieve an invoice's line items
- `PostInvoicesInvoiceLinesLineItemId` — Update an invoice's line item
- `PostInvoicesInvoiceMarkUncollectible` — Mark an invoice as uncollectible
- `PostInvoicesInvoicePay` — Pay an invoice
- `PostInvoicesInvoiceRemoveLines` — Bulk remove invoice line items
- `PostInvoicesInvoiceSend` — Send an invoice for manual payment
- `PostInvoicesInvoiceUpdateLines` — Bulk update invoice line items
- `PostInvoicesInvoiceVoid` — Void an invoice
- `GetIssuingAuthorizations` — List all authorizations
- `GetIssuingAuthorizationsAuthorization` — Retrieve an authorization
- `PostIssuingAuthorizationsAuthorization` — Update an authorization
- `PostIssuingAuthorizationsAuthorizationApprove` — Approve an authorization
- `PostIssuingAuthorizationsAuthorizationDecline` — Decline an authorization
- `GetIssuingCardholders` — List all cardholders
- `PostIssuingCardholders` — Create a cardholder
- `GetIssuingCardholdersCardholder` — Retrieve a cardholder
- `PostIssuingCardholdersCardholder` — Update a cardholder
- `GetIssuingCards` — List all cards
- `PostIssuingCards` — Create a card
- `GetIssuingCardsCard` — Retrieve a card
- `PostIssuingCardsCard` — Update a card
- `GetIssuingDisputes` — List all disputes
- `PostIssuingDisputes` — Create a dispute
- `GetIssuingDisputesDispute` — Retrieve a dispute
- `PostIssuingDisputesDispute` — Update a dispute
- `PostIssuingDisputesDisputeSubmit` — Submit a dispute
- `GetIssuingPersonalizationDesigns` — List all personalization designs
- `PostIssuingPersonalizationDesigns` — Create a personalization design
- `GetIssuingPersonalizationDesignsPersonalizationDesign` — Retrieve a personalization design
- `PostIssuingPersonalizationDesignsPersonalizationDesign` — Update a personalization design
- `GetIssuingPhysicalBundles` — List all physical bundles
- `GetIssuingPhysicalBundlesPhysicalBundle` — Retrieve a physical bundle
- `GetIssuingSettlementsSettlement` — Retrieve a settlement
- `PostIssuingSettlementsSettlement` — Update a settlement
- `GetIssuingTokens` — List all issuing tokens for card
- `GetIssuingTokensToken` — Retrieve an issuing token
- `PostIssuingTokensToken` — Update a token status
- `GetIssuingTransactions` — List all transactions
- `GetIssuingTransactionsTransaction` — Retrieve a transaction
- `PostIssuingTransactionsTransaction` — Update a transaction
- `PostLinkAccountSessions` — Create a Session
- `GetLinkAccountSessionsSession` — Retrieve a Session
- `GetLinkedAccounts` — List Accounts
- `GetLinkedAccountsAccount` — Retrieve an Account
- `PostLinkedAccountsAccountDisconnect` — Disconnect an Account
- `GetLinkedAccountsAccountOwners` — List Account Owners
- `PostLinkedAccountsAccountRefresh` — Refresh Account data
- `GetMandatesMandate` — Retrieve a Mandate
- `GetPaymentAttemptRecords` — List Payment Attempt Records
- `GetPaymentAttemptRecordsId` — Retrieve a Payment Attempt Record
- `GetPaymentIntents` — List all PaymentIntents
- `PostPaymentIntents` — Create a PaymentIntent
- `GetPaymentIntentsSearch` — Search PaymentIntents
- `GetPaymentIntentsIntent` — Retrieve a PaymentIntent
- `PostPaymentIntentsIntent` — Update a PaymentIntent
- `GetPaymentIntentsIntentAmountDetailsLineItems` — List all PaymentIntent LineItems
- `PostPaymentIntentsIntentApplyCustomerBalance` — Reconcile a customer_balance PaymentIntent
- `PostPaymentIntentsIntentCancel` — Cancel a PaymentIntent
- `PostPaymentIntentsIntentCapture` — Capture a PaymentIntent
- `PostPaymentIntentsIntentConfirm` — Confirm a PaymentIntent
- `PostPaymentIntentsIntentIncrementAuthorization` — Increment an authorization
- `PostPaymentIntentsIntentVerifyMicrodeposits` — Verify microdeposits on a PaymentIntent
- `GetPaymentLinks` — List all payment links
- `PostPaymentLinks` — Create a payment link
- `GetPaymentLinksPaymentLink` — Retrieve payment link
- `PostPaymentLinksPaymentLink` — Update a payment link
- `GetPaymentLinksPaymentLinkLineItems` — Retrieve a payment link's line items
- `GetPaymentMethodConfigurations` — List payment method configurations
- `PostPaymentMethodConfigurations` — Create a payment method configuration
- `GetPaymentMethodConfigurationsConfiguration` — Retrieve payment method configuration
- `PostPaymentMethodConfigurationsConfiguration` — Update payment method configuration
- `GetPaymentMethodDomains` — List payment method domains
- `PostPaymentMethodDomains` — Create a payment method domain
- `GetPaymentMethodDomainsPaymentMethodDomain` — Retrieve a payment method domain
- `PostPaymentMethodDomainsPaymentMethodDomain` — Update a payment method domain
- `PostPaymentMethodDomainsPaymentMethodDomainValidate` — Validate an existing payment method domain
- `GetPaymentMethods` — List PaymentMethods
- `PostPaymentMethods` — Shares a PaymentMethod
- `GetPaymentMethodsPaymentMethod` — Retrieve a PaymentMethod
- `PostPaymentMethodsPaymentMethod` — Update a PaymentMethod
- `PostPaymentMethodsPaymentMethodAttach` — Attach a PaymentMethod to a Customer
- `PostPaymentMethodsPaymentMethodDetach` — Detach a PaymentMethod from a Customer
- `PostPaymentRecordsReportPayment` — Report a payment
- `GetPaymentRecordsId` — Retrieve a Payment Record
- `PostPaymentRecordsIdReportPaymentAttempt` — Report a payment attempt
- `PostPaymentRecordsIdReportPaymentAttemptCanceled` — Report payment attempt canceled
- `PostPaymentRecordsIdReportPaymentAttemptFailed` — Report payment attempt failed
- `PostPaymentRecordsIdReportPaymentAttemptGuaranteed` — Report payment attempt guaranteed
- `PostPaymentRecordsIdReportPaymentAttemptInformational` — Report payment attempt informational
- `PostPaymentRecordsIdReportRefund` — Report a refund
- `GetPayouts` — List all payouts
- `PostPayouts` — Create a payout
- `GetPayoutsPayout` — Retrieve a payout
- `PostPayoutsPayout` — Update a payout
- `PostPayoutsPayoutCancel` — Cancel a payout
- `PostPayoutsPayoutReverse` — Reverse a payout
- `GetPlans` — List all plans
- `PostPlans` — Create a plan
- `GetPlansPlan` — Retrieve a plan
- `PostPlansPlan` — Update a plan
- `DeletePlansPlan` — Delete a plan
- `GetPrices` — List all prices
- `PostPrices` — Create a price
- `GetPricesSearch` — Search prices
- `GetPricesPrice` — Retrieve a price
- `PostPricesPrice` — Update a price
- `GetProducts` — List all products
- `PostProducts` — Create a product
- `GetProductsSearch` — Search products
- `GetProductsId` — Retrieve a product
- `PostProductsId` — Update a product
- `DeleteProductsId` — Delete a product
- `GetProductsProductFeatures` — List all features attached to a product
- `PostProductsProductFeatures` — Attach a feature to a product
- `GetProductsProductFeaturesId` — Retrieve a product_feature
- `DeleteProductsProductFeaturesId` — Remove a feature from a product
- `GetPromotionCodes` — List all promotion codes
- `PostPromotionCodes` — Create a promotion code
- `GetPromotionCodesPromotionCode` — Retrieve a promotion code
- `PostPromotionCodesPromotionCode` — Update a promotion code
- `GetQuotes` — List all quotes
- `PostQuotes` — Create a quote
- `GetQuotesQuote` — Retrieve a quote
- `PostQuotesQuote` — Update a quote
- `PostQuotesQuoteAccept` — Accept a quote
- `PostQuotesQuoteCancel` — Cancel a quote
- `GetQuotesQuoteComputedUpfrontLineItems` — Retrieve a quote's upfront line items
- `PostQuotesQuoteFinalize` — Finalize a quote
- `GetQuotesQuoteLineItems` — Retrieve a quote's line items
- `GetQuotesQuotePdf` — Download quote PDF
- `GetRadarEarlyFraudWarnings` — List all early fraud warnings
- `GetRadarEarlyFraudWarningsEarlyFraudWarning` — Retrieve an early fraud warning
- `PostRadarPaymentEvaluations` — Create a Payment Evaluation
- `GetRadarValueListItems` — List all value list items
- `PostRadarValueListItems` — Create a value list item
- `GetRadarValueListItemsItem` — Retrieve a value list item
- `DeleteRadarValueListItemsItem` — Delete a value list item
- `GetRadarValueLists` — List all value lists
- `PostRadarValueLists` — Create a value list
- `GetRadarValueListsValueList` — Retrieve a value list
- `PostRadarValueListsValueList` — Update a value list
- `DeleteRadarValueListsValueList` — Delete a value list
- `GetRefunds` — List all refunds
- `PostRefunds` — Create customer balance refund
- `GetRefundsRefund` — Retrieve a refund
- `PostRefundsRefund` — Update a refund
- `PostRefundsRefundCancel` — Cancel a refund
- `GetReportingReportRuns` — List all Report Runs
- `PostReportingReportRuns` — Create a Report Run
- `GetReportingReportRunsReportRun` — Retrieve a Report Run
- `GetReportingReportTypes` — List all Report Types
- `GetReportingReportTypesReportType` — Retrieve a Report Type
- `GetReviews` — List all open reviews
- `GetReviewsReview` — Retrieve a review
- `PostReviewsReviewApprove` — Approve a review
- `GetSetupAttempts` — List all SetupAttempts
- `GetSetupIntents` — List all SetupIntents
- `PostSetupIntents` — Create a SetupIntent
- `GetSetupIntentsIntent` — Retrieve a SetupIntent
- `PostSetupIntentsIntent` — Update a SetupIntent
- `PostSetupIntentsIntentCancel` — Cancel a SetupIntent
- `PostSetupIntentsIntentConfirm` — Confirm a SetupIntent
- `PostSetupIntentsIntentVerifyMicrodeposits` — Verify microdeposits on a SetupIntent
- `GetShippingRates` — List all shipping rates
- `PostShippingRates` — Create a shipping rate
- `GetShippingRatesShippingRateToken` — Retrieve a shipping rate
- `PostShippingRatesShippingRateToken` — Update a shipping rate
- `PostSigmaSavedQueriesId` — Update an existing Sigma Query
- `GetSigmaScheduledQueryRuns` — List all scheduled query runs
- `GetSigmaScheduledQueryRunsScheduledQueryRun` — Retrieve a scheduled query run
- `PostSources` — Shares a source
- `GetSourcesSource` — Retrieve a source
- `PostSourcesSource` — Update a source
- `GetSourcesSourceMandateNotificationsMandateNotification` — Retrieve a Source MandateNotification
- `GetSourcesSourceSourceTransactions` — <p>List source transactions for a given source.</p>
- `GetSourcesSourceSourceTransactionsSourceTransaction` — Retrieve a source transaction
- `PostSourcesSourceVerify` — <p>Verify a given source.</p>
- `GetSubscriptionItems` — List all subscription items
- `PostSubscriptionItems` — Create a subscription item
- `GetSubscriptionItemsItem` — Retrieve a subscription item
- `PostSubscriptionItemsItem` — Update a subscription item
- `DeleteSubscriptionItemsItem` — Delete a subscription item
- `GetSubscriptionSchedules` — List all schedules
- `PostSubscriptionSchedules` — Create a schedule
- `GetSubscriptionSchedulesSchedule` — Retrieve a schedule
- `PostSubscriptionSchedulesSchedule` — Update a schedule
- `PostSubscriptionSchedulesScheduleCancel` — Cancel a schedule
- `PostSubscriptionSchedulesScheduleRelease` — Release a schedule
- `GetSubscriptions` — List subscriptions
- `PostSubscriptions` — Create a subscription
- `GetSubscriptionsSearch` — Search subscriptions
- `GetSubscriptionsSubscriptionExposedId` — Retrieve a subscription
- `PostSubscriptionsSubscriptionExposedId` — Update a subscription
- `DeleteSubscriptionsSubscriptionExposedId` — Cancel a subscription
- `DeleteSubscriptionsSubscriptionExposedIdDiscount` — Delete a subscription discount
- `PostSubscriptionsSubscriptionMigrate` — Migrate a subscription
- `PostSubscriptionsSubscriptionResume` — Resume a subscription
- `GetTaxAssociationsFind` — Find a Tax Association
- `PostTaxCalculations` — Create a Calculation
- `GetTaxCalculationsCalculation` — Retrieve a Calculation
- `GetTaxCalculationsCalculationLineItems` — Retrieve a Calculation's line items
- `GetTaxRegistrations` — List registrations
- `PostTaxRegistrations` — Create a registration
- `GetTaxRegistrationsId` — Retrieve a registration
- `PostTaxRegistrationsId` — Update a registration
- `GetTaxSettings` — Retrieve settings
- `PostTaxSettings` — Update settings
- `PostTaxTransactionsCreateFromCalculation` — Create a Transaction from a Calculation
- `PostTaxTransactionsCreateReversal` — Create a reversal Transaction
- `GetTaxTransactionsTransaction` — Retrieve a Transaction
- `GetTaxTransactionsTransactionLineItems` — Retrieve a Transaction's line items
- `GetTaxCodes` — List all tax codes
- `GetTaxCodesId` — Retrieve a tax code
- `GetTaxIds` — List all tax IDs
- `PostTaxIds` — Create a tax ID
- `GetTaxIdsId` — Retrieve a tax ID
- `DeleteTaxIdsId` — Delete a tax ID
- `GetTaxRates` — List all tax rates
- `PostTaxRates` — Create a tax rate
- `GetTaxRatesTaxRate` — Retrieve a tax rate
- `PostTaxRatesTaxRate` — Update a tax rate
- `GetTerminalConfigurations` — List all Configurations
- `PostTerminalConfigurations` — Create a Configuration
- `GetTerminalConfigurationsConfiguration` — Retrieve a Configuration
- `PostTerminalConfigurationsConfiguration` — Update a Configuration
- `DeleteTerminalConfigurationsConfiguration` — Delete a Configuration
- `PostTerminalConnectionTokens` — Create a Connection Token
- `GetTerminalLocations` — List all Locations
- `PostTerminalLocations` — Create a Location
- `GetTerminalLocationsLocation` — Retrieve a Location
- `PostTerminalLocationsLocation` — Update a Location
- `DeleteTerminalLocationsLocation` — Delete a Location
- `PostTerminalOnboardingLinks` — Create an Onboarding Link
- `GetTerminalReaders` — List all Readers
- `PostTerminalReaders` — Create a Reader
- `GetTerminalReadersReader` — Retrieve a Reader
- `PostTerminalReadersReader` — Update a Reader
- `DeleteTerminalReadersReader` — Delete a Reader
- `PostTerminalReadersReaderCancelAction` — Cancel the current reader action
- `PostTerminalReadersReaderCollectInputs` — Collect inputs using a Reader
- `PostTerminalReadersReaderCollectPaymentMethod` — Hand off a PaymentIntent to a Reader and collect card details
- `PostTerminalReadersReaderConfirmPaymentIntent` — Confirm a PaymentIntent on the Reader
- `PostTerminalReadersReaderProcessPaymentIntent` — Hand-off a PaymentIntent to a Reader
- `PostTerminalReadersReaderProcessSetupIntent` — Hand-off a SetupIntent to a Reader
- `PostTerminalReadersReaderRefundPayment` — Refund a Charge or a PaymentIntent in-person
- `PostTerminalReadersReaderSetReaderDisplay` — Set reader display
- `PostTerminalRefunds` — Create a refund using a Terminal-supported device.
- `PostTestHelpersConfirmationTokens` — Create a test Confirmation Token
- `PostTestHelpersCustomersCustomerFundCashBalance` — Fund a test mode cash balance
- `PostTestHelpersIssuingAuthorizations` — Create a test-mode authorization
- `PostTestHelpersIssuingAuthorizationsAuthorizationCapture` — Capture a test-mode authorization
- `PostTestHelpersIssuingAuthorizationsAuthorizationExpire` — Expire a test-mode authorization
- `PostTestHelpersIssuingAuthorizationsAuthorizationFinalizeAmount` — Finalize a test-mode authorization's amount
- `PostTestHelpersIssuingAuthorizationsAuthorizationFraudChallengesRespond` — Respond to fraud challenge
- `PostTestHelpersIssuingAuthorizationsAuthorizationIncrement` — Increment a test-mode authorization
- `PostTestHelpersIssuingAuthorizationsAuthorizationReverse` — Reverse a test-mode authorization
- `PostTestHelpersIssuingCardsCardShippingDeliver` — Deliver a testmode card
- `PostTestHelpersIssuingCardsCardShippingFail` — Fail a testmode card
- `PostTestHelpersIssuingCardsCardShippingReturn` — Return a testmode card
- `PostTestHelpersIssuingCardsCardShippingShip` — Ship a testmode card
- `PostTestHelpersIssuingCardsCardShippingSubmit` — Submit a testmode card
- `PostTestHelpersIssuingPersonalizationDesignsPersonalizationDesignActivate` — Activate a testmode personalization design
- `PostTestHelpersIssuingPersonalizationDesignsPersonalizationDesignDeactivate` — Deactivate a testmode personalization design
- `PostTestHelpersIssuingPersonalizationDesignsPersonalizationDesignReject` — Reject a testmode personalization design
- `PostTestHelpersIssuingSettlements` — Create a test-mode settlement
- `PostTestHelpersIssuingSettlementsSettlementComplete` — Complete a test-mode settlement
- `PostTestHelpersIssuingTransactionsCreateForceCapture` — Create a test-mode force capture
- `PostTestHelpersIssuingTransactionsCreateUnlinkedRefund` — Create a test-mode unlinked refund
- `PostTestHelpersIssuingTransactionsTransactionRefund` — Refund a test-mode transaction
- `PostTestHelpersRefundsRefundExpire` — Expire a pending refund.
- `PostTestHelpersTerminalReadersReaderPresentPaymentMethod` — Simulate presenting a payment method
- `PostTestHelpersTerminalReadersReaderSucceedInputCollection` — Simulate a successful input collection
- `PostTestHelpersTerminalReadersReaderTimeoutInputCollection` — Simulate an input collection timeout
- `GetTestHelpersTestClocks` — List all test clocks
- `PostTestHelpersTestClocks` — Create a test clock
- `GetTestHelpersTestClocksTestClock` — Retrieve a test clock
- `DeleteTestHelpersTestClocksTestClock` — Delete a test clock
- `PostTestHelpersTestClocksTestClockAdvance` — Advance a test clock
- `PostTestHelpersTreasuryInboundTransfersIdFail` — Test mode: Fail an InboundTransfer
- `PostTestHelpersTreasuryInboundTransfersIdReturn` — Test mode: Return an InboundTransfer
- `PostTestHelpersTreasuryInboundTransfersIdSucceed` — Test mode: Succeed an InboundTransfer
- `PostTestHelpersTreasuryOutboundPaymentsId` — Test mode: Update an OutboundPayment
- `PostTestHelpersTreasuryOutboundPaymentsIdFail` — Test mode: Fail an OutboundPayment
- `PostTestHelpersTreasuryOutboundPaymentsIdPost` — Test mode: Post an OutboundPayment
- `PostTestHelpersTreasuryOutboundPaymentsIdReturn` — Test mode: Return an OutboundPayment
- `PostTestHelpersTreasuryOutboundTransfersOutboundTransfer` — Test mode: Update an OutboundTransfer
- `PostTestHelpersTreasuryOutboundTransfersOutboundTransferFail` — Test mode: Fail an OutboundTransfer
- `PostTestHelpersTreasuryOutboundTransfersOutboundTransferPost` — Test mode: Post an OutboundTransfer
- `PostTestHelpersTreasuryOutboundTransfersOutboundTransferReturn` — Test mode: Return an OutboundTransfer
- `PostTestHelpersTreasuryReceivedCredits` — Test mode: Create a ReceivedCredit
- `PostTestHelpersTreasuryReceivedDebits` — Test mode: Create a ReceivedDebit
- `PostTokens` — Create a CVC update token
- `GetTokensToken` — Retrieve a token
- `GetTopups` — List all top-ups
- `PostTopups` — Create a top-up
- `GetTopupsTopup` — Retrieve a top-up
- `PostTopupsTopup` — Update a top-up
- `PostTopupsTopupCancel` — Cancel a top-up
- `GetTransfers` — List all transfers
- `PostTransfers` — Create a transfer
- `GetTransfersIdReversals` — List all reversals
- `PostTransfersIdReversals` — Create a transfer reversal
- `GetTransfersTransfer` — Retrieve a transfer
- `PostTransfersTransfer` — Update a transfer
- `GetTransfersTransferReversalsId` — Retrieve a reversal
- `PostTransfersTransferReversalsId` — Update a reversal
- `GetTreasuryCreditReversals` — List all CreditReversals
- `PostTreasuryCreditReversals` — Create a CreditReversal
- `GetTreasuryCreditReversalsCreditReversal` — Retrieve a CreditReversal
- `GetTreasuryDebitReversals` — List all DebitReversals
- `PostTreasuryDebitReversals` — Create a DebitReversal
- `GetTreasuryDebitReversalsDebitReversal` — Retrieve a DebitReversal
- `GetTreasuryFinancialAccounts` — List all FinancialAccounts
- `PostTreasuryFinancialAccounts` — Create a FinancialAccount
- `GetTreasuryFinancialAccountsFinancialAccount` — Retrieve a FinancialAccount
- `PostTreasuryFinancialAccountsFinancialAccount` — Update a FinancialAccount
- `PostTreasuryFinancialAccountsFinancialAccountClose` — Close a FinancialAccount
- `GetTreasuryFinancialAccountsFinancialAccountFeatures` — Retrieve FinancialAccount Features
- `PostTreasuryFinancialAccountsFinancialAccountFeatures` — Update FinancialAccount Features
- `GetTreasuryInboundTransfers` — List all InboundTransfers
- `PostTreasuryInboundTransfers` — Create an InboundTransfer
- `GetTreasuryInboundTransfersId` — Retrieve an InboundTransfer
- `PostTreasuryInboundTransfersInboundTransferCancel` — Cancel an InboundTransfer
- `GetTreasuryOutboundPayments` — List all OutboundPayments
- `PostTreasuryOutboundPayments` — Create an OutboundPayment
- `GetTreasuryOutboundPaymentsId` — Retrieve an OutboundPayment
- `PostTreasuryOutboundPaymentsIdCancel` — Cancel an OutboundPayment
- `GetTreasuryOutboundTransfers` — List all OutboundTransfers
- `PostTreasuryOutboundTransfers` — Create an OutboundTransfer
- `GetTreasuryOutboundTransfersOutboundTransfer` — Retrieve an OutboundTransfer
- `PostTreasuryOutboundTransfersOutboundTransferCancel` — Cancel an OutboundTransfer
- `GetTreasuryReceivedCredits` — List all ReceivedCredits
- `GetTreasuryReceivedCreditsId` — Retrieve a ReceivedCredit
- `GetTreasuryReceivedDebits` — List all ReceivedDebits
- `GetTreasuryReceivedDebitsId` — Retrieve a ReceivedDebit
- `GetTreasuryTransactionEntries` — List all TransactionEntries
- `GetTreasuryTransactionEntriesId` — Retrieve a TransactionEntry
- `GetTreasuryTransactions` — List all Transactions
- `GetTreasuryTransactionsId` — Retrieve a Transaction
- `GetWebhookEndpoints` — List all webhook endpoints
- `PostWebhookEndpoints` — Create a webhook endpoint
- `GetWebhookEndpointsWebhookEndpoint` — Retrieve a webhook endpoint
- `PostWebhookEndpointsWebhookEndpoint` — Update a webhook endpoint
- `DeleteWebhookEndpointsWebhookEndpoint` — Delete a webhook endpoint

## Setup

```bash
npm install
npm run build
# Register in ~/.claude.json or project .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "stripe-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "env": {
        "API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Auth

Set `API_KEY` (env var for stdio, `wrangler secret` for http) to your upstream API token.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  <spec-url> <output-dir> --name stripe-mcp --target mcp-server --transport stdio
```
