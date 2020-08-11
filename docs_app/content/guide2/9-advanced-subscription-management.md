# Advanced Subscription Management

## TLDR

- You can use [`Subscription`](API) [`add`](API) to add child subscriptions to a single parent.
- Child subscriptions remove themselves from parents automatically when the child is unsubscribed.
- Terminal operators like [`takeUntil`](API) or [`first`](API) are a flexible alternative to [`Subscription`](API) objects.
- [`switchMap`](API) has an implicit [unsubscribe](GL) that can be useful.

## Overview

As you're developing a component, service, or application, you might find that you create a growing number of subscriptions you need to manage. There are many strategies for handling these subscriptions effectively, and all of them are valid. Here, we're going to talk about the different strategies and the trade-offs to each one.

> FRAMEWORK AGNOSTIC: The examples below are intentionally generic to avoid any association with a given framework, or even front-end web development. Just assume that `onInit` and `onDestroy` fire when our generic component is in use and no longer being used by the system it lives in. (The examples are clearly "client-side", but RxJS can be used on a server or in any JS environment).

## Strategy 1: Ad-Hoc

With this strategy, it's almost "no strategy", you will basically track each subscription individually in its property or variable, and unsubscribe from it when you see fit. The code example below shows an ad-hoc strategy:


```ts
class MyComponent {
    ///////
    // These are "read" points for our system. We're writing to these
    // in our subscription and we'll pretend that is what is being read
    // by whatever is using this component class.
    //////

    /** The number of clicks so far */
    clickCount = 0;

    /** A rough estimate of seconds ellapsed */
    secondsElapsed = 0;

    /** The seconds elapsed as of the last click */
    secondsAtLastTick?: number;

    /////
    // Our Subscriptions references! This is what we're going to use to do 
    // our ad-hoc management of subscriptions
    /////
    private tickerSubscription?: Subscription;
    private clickSubscription?: Subscription;


    /////
    // Our observables. These are the various observables we're going to subscribe
    // to while our component is active.
    /////

    /**
     * An observable of incrementing numbers, starting at 0 and going up,
     * approximately every second.
     */
    private ticks$ = timer(0, 1000);

    /**
     * An observable of click events from some button related to our component.
     */
    private buttonClicks$ = fromEvent(document.querySelector('#mybutton'), 'click');


    /////
    // External methods that affect subscriptions
    ////
    
    /**
     * This method could be called by the system to stop updating values
     * related to our button clicks.
     */
    stopListeningForClicks() {
        this.clickSubscription?.unsubscribe();
        this.clickSubscription = undefined;
    }

    /**
     * An call to start listening for clicks.
     */
    startListeningForClicks() {
        if (!this.clickSubscription) {
            this.clickSubscription = this.buttonClicks$.subscribe(() => {
                this.secondsAtLastTick = this.secondsElapsed;
                this.clickCount++;
            });
        }
    }

    /////
    // Lifecycle events
    //// 

    /**
     * Called when the component initializes
     */
    private onInit() {
        // In here is where we are starting all of our subscriptions.
        this.tickerSubscription = this.ticks$.subscribe(tick => {
            this.secondsElapsed = tick;
        });
        this.startListeningForClicks();
    }

    /**
     * Called when the component is destroyed.
     */
    private onDestroy() {
        this.tickerSubscription?.unsubscribe();
        this.clickSubscription?.unsubscribe();
    }
}
```

### Things To Notice

There are a few things to note about the ad-hoc strategy:

* Our `clickSubscription` is being set to `undefined`. This because we're using `clickSubscription` in the `startListeningForClicks()` method to check to make sure we don't subscribe to it twice. (Idempotence).
* Subscription properities/variables are named very specifically. Stay away from naming them `subscription` or `sub1` and `sub2`. That isn't very useful.
* Note that we are NOT setting our subscription references to `undefined` in our `onDestroy()` call. This is because in most systems/frameworks (such as Angular, React, Vue, et al), an "onDestroy" or equivalent ("componentWillUnmount", etc), is being called before the entire component itself is going to be orphaned for garbage collection. **If you are unsure that your class instance will be garbage collected**, you should set your subscription properties to `undefined` so the subscription instances will be garbage collected. Subscriptions themselves can sometimes contain references to large allocations, depending on various operators you could be using (such as those that cache values).

### Pros

- This is the lightest-weight approach, in terms of memory/allocations/processing etc. All other approaches will do some form of what you see above using the same object references, just wrapped in other code.
- It's relatively easy to follow for some. All subscriptions have explicit names, and it's easy to grep for usage.

### Cons

- It's very verbose. There is a lot of work done to create variables, track them, clear them etc.
- In larger components, it can be easy to create a subscription, then forget to unsubscribe. So it will require a little more double-checking than some other approaches.

## Strategy 2: Composite Subscriptions

Also called "parent subscriptions". With this approach you create a single, "parent" subscriptoin and register all child subscriptions to it with the [`add`](API) method.


```ts
class MyComponent {
    ///////
    // These are "read" points for our system. We're writing to these
    // in our subscription and we'll pretend that is what is being read
    // by whatever is using this component class.
    //////

    /** The number of clicks so far */
    clickCount = 0;

    /** A rough estimate of seconds ellapsed */
    secondsElapsed = 0;

    /** The seconds elapsed as of the last click */
    secondsAtLastTick?: number;

    ////
    // Subscription references
    ////

    /** The parent subscription for the component */
    private mainSubscription = new Subscription();

    /** The subscription for our clicks */
    private clickSubscription?: Subscription;


    /////
    // Our observables. These are the various observables we're going to subscribe
    // to while our component is active.
    /////

    /**
     * An observable of incrementing numbers, starting at 0 and going up,
     * approximately every second.
     */
    private ticks$ = timer(0, 1000);

    /**
     * An observable of click events from some button related to our component.
     */
    private buttonClicks$ = fromEvent(document.querySelector('#mybutton'), 'click');


    /////
    // External methods that affect subscriptions
    ////

    /**
     * This method could be called by the system to stop updating values
     * related to our button clicks.
     */
    stopListeningForClicks() {
        this.clickSubscription?.unsubscribe();
        this.clickSubscription = undefined;
    }

    /**
     * An call to start listening for clicks.
     */
    startListeningForClicks() {
        if (!this.clickSubscription) {
            this.clickSubscription = this.mainSubscription.add(
                this.buttonClicks$.subscribe(() => {
                    this.secondsAtLastTick = this.secondsElapsed;
                    this.clickCount++;
                })
            );
        }
    }

    /////
    // Lifecycle events
    //// 

    /**
     * Called when the component initializes
     */
    private onInit() {
        // In here is where we are starting all of our subscriptions.
        this.tickerSubscription = this.ticks$.subscribe(tick => {
            this.secondsElapsed = tick;
        });
        this.startListeningForClicks();
    }

    /**
     * Called when the component is destroyed.
     */
    private onDestroy() {
        this.mainSubscription?.unsubscribe();
    }
}
```

### Things To Notice

- We still had to maintain the `clickSubscription` separately, because of how we were using it with our publicly exposed methods.
- We didn't have to remove the `clickSubscription` from `mainSubscription` when it was unsubscribed in `stopListeningForClicks()`. This is because child subscriptions automatically remove themselves from parents when unsubscribed.

### Pros

- A bit easier to manage large numbers of subscriptions and ensure that you unsubscribe all of them at once.
- Internally, this will release all child subscriptions when it is unsubscribed, helping with garbage collection issues mentioned above.

### Cons

- Still need to manage subscriptions that could be unsubscribed in more than one way seperately.
- Almost as verbose, in some cases, as the ad-hoc approach above.


### Strategy 3: Terminal Operators Like `takeUntil` and `first` (et al)

This particular strategy takes a different tack entirely. Rather than managing subscriptions through [unsubscription](GL), it is managing them through [completion](GL). Operators like `takeUntil` force subscription teardown by composing in behaviors that cause the subscription to complete.


```ts
class MyComponent {
    ///////
    // These are "read" points for our system. We're writing to these
    // in our subscription and we'll pretend that is what is being read
    // by whatever is using this component class.
    //////

    /** The number of clicks so far */
    clickCount = 0;

    /** A rough estimate of seconds ellapsed */
    secondsElapsed = 0;

    /** The seconds elapsed as of the last click */
    secondsAtLastTick?: number;

    
    //// 
    // Teardown notifiers
    ////
    
    /** Will emit when onDestroy fires (wired below) */
    private destroyed$ = new Subject<void>();

    /** Will emit when stop listening for clicks is called */
    private stopListeningForClicks$ = new Subject<void>();


    ////
    // Start up notifier
    ////

    /** Will emit when there is a call to `startListeningForClicks()` */
    private startListeningForClicks$ = new Subject<void>();

    /////
    // Our observables. These are the various observables we're going to subscribe
    // to while our component is active.
    /////

    /**
     * An observable of incrementing numbers, starting at 0 and going up,
     * approximately every second.
     */
    private ticks$ = timer(0, 1000).pipe(
        takeUntil(this.destroyed$)
    );

    /**
     * An observable of click events from some button related to our component.
     */
    private buttonClicks$ = this.startListeningForClicks$.pipe(
        exhaustMap(() => 
            fromEvent(document.querySelector('#mybutton'), 'click').pipe(
                takeUntil(this.stopListeningForClicks$),
            )
        ),
        takeUntil(this.destroyed$)
    );


    /////
    // External methods that affect subscriptions
    ////

    /**
     * This method could be called by the system to stop updating values
     * related to our button clicks.
     */
    stopListeningForClicks() {
        this.stopListeningForClicks$.next();
    }

    /**
     * An call to start listening for clicks.
     */
    startListeningForClicks() {
        this.startListeningForClick$.next();
    }

    /////
    // Lifecycle events
    //// 

    /**
     * Called when the component initializes
     */
    private onInit() {
        // In here is where we are starting all of our subscriptions.
        this.ticks$.subscribe(tick => {
            this.secondsElapsed = tick;
        });
        this.buttonClicks$.subscribe(() => {
            this.secondsAtLastTick = this.secondsElapsed;
            this.clickCount++;
        });
    }

    /**
     * Called when the component is destroyed.
     */
    private onDestroy() {
        this.destroyed$.next();
    }
}
```

### Things To Notice

- We're not longer tracking `Subscription` objects anywhere. Instead, we're relying on the teardown to occur when the subscriptions are completed by `takeUntil` calls.
- We needed to change how we started the clicks subscription. This is because before we were relying on the presence of the subscription object, which we are no longer tracking.
- This also exhibits the use of a [`Subject`](API) as a notifier to _start_ a subscription. We can use this to start all observables in the component, if we chose, meaning that subscription and teardown behaviors for any given observable could be tracked at its point of declaration.

### PROS

- The teardown behavior for any given observable is composed at the site of the observable's declaration. It becomes apparent as to when this subscription will be torn down from reading the code in one spot. (As opposed to needing to look for the `onDestroy` method).
- It is declarative. Adding more teardown behaviors to this is a lot easier.
- No `Subscription` objects to track.

### CONS

- More allocations and overhead than composite subscriptions or ad-hoc strategies. We have to use more operators, which means more subscribers and subscriptions, and more function calls during the processing of the streams.
- Very "Rx-y". This approach relies on the developers to have a strong knowledge of RxJS and its operators, and might not be a palatable approach for some times.


### Strategy 4: Tap And Join

TODO

### Mixing Strategies

TODO