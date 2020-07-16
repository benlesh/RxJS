# 2. Unsubscribing

## TLDR:

- Calls to [`subscribe`](API) return a [`Subscription`](API) object.
- Calling [`unsubscribe`](API) on the [`Subscription`](API) object notifies the [producer](GL) to stop sending values, and triggers the [teardown](GL) of any underlying resources the [producer](GL) has registered for teardown.
- Failure to [unsubscribe](GL) from asynchronous observables will result in unnecessary resource use, and even memory leaks.
- Any errors that occur during teardown will be collected and rethrown as an [`UnsubscriptoinError`](API).

## Overview

Just as you need to know how to start getting values from your observable, you must also need to know how to tell the [producer](GL) to stop sending values, and perhaps more importantly, to [teardown](GL) and free up resources.

## Subscriptions

All calls to [`subscribe`](API) return a [`Subscription`](API) object. In order to end your [subscription](GL) and tell the [producer](GL) to stop sending values and [teardown](API), you must call [`unsubscribe`](API).

When [`unsubscribe`](API) is called, it will synchronously trigger the [teardown](GL) of the entire [stream](GL) and all underlying [producers](GL) from [cold](GL) sources. This means from that exact moment on, no values can be [nexted](GL), and you cannot be [notified](GL) of any errors or completions.

By the time the [`unsubscribe`](API) call returns, an attempt to [teardown](GL) has completed.

## Unsubscription Errors

On rare occasions, logic executed to [teardown](GL) a [subscription](GL) can throw an error. These thrown errors, if they occur synchronously during teardown, will be collected and reported at the end of the [`unsubscribe`](API) call. Since [subscriptions](GL) are [chained](GL), RxJS will attempt to execute all teardowns in the chain and free up as many resources as it can before it reports the error. The error will be synchronously thrown at the end of the [`unsubscribe`](API) call as an [`UnsubscriptionError`](API), and can be caught by wrapping the [`unsubscribe`](API) call in a `try-catch`.

```ts
const subscription = source$.subscribe(console.log);

try {
    subscription.unsubscribe();
} catch (unsubError) {
    // Any error in here will be an UnsubscriptionError, unless you
    // have other calls nested in your try { } block.
    console.error(`Unsubscription encountered ${unsubError.errors.length} errors`);
    for (const error of unsubError.errors) {
        console.error(error);
    }
}
```