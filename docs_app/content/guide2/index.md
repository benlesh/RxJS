# RxJS Guide

Author: Ben Lesh

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://licensebuttons.net/l/by/4.0/80x15.png" /></a>
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>

## Work In Progress

This guide is evolving. Some sections below are marked "TODO" because they are currently under development.

## Overview

This section is a guide to how to approach RxJS concepts and how to address common issues while learning and using this library. The goal is to go into as much detail as possible or necessary in as many aspects of RxJS as possible while also trying to provide a quick high-level overview of the concepts.

As you are reading, if you don't have time to dive deeply into any one topic, please note that each section has a **"TLDR"** section at the top. For those of you that aren't sure what that means, it means "Too long, didn't read". These sections intend to give the quickest possible summary of the content of the page.

## Topics

The topics are ordered intentionally to provide insight into things folks will need to know about RxJS first before diving into deeper topics. For example, one of the first things people need to know about RxJS is [how to subscribe to an observable](1-subscribing.md), because often "first contact" with RxJS is because they have gotten an observable back from some API or service they just started using in their codebase.


1. [Subscribing](1-subscribing.md)
2. [Unsubscribing](2-unsubscribing.md)
3. [Creating An Observable](3-creating-an-observable.md)
4. [What Is An Operator?](4-what-is-an-operator.md)
5. [Implementing Operators](5-implementing-operators.md)
6. [Chaining Operators](6-chaining-operators.md)
7. [Flattening Operations](7-flattening-operations.md)
8. [Subjects](8-subjects.md)
9.  Multicasting (TODO)
10. Error Handling (TODO)
11. Async Await And Promises (TODO)
12. Schedulers And Scheduling (TODO)
13. Testing Operators (TODO)
14. Testing Application Code (TODO)
15. Debugging (TODO)
16. Performance (TODO)

## Additional Topics

* [Why Observables?](why-observables.md)
* [When You Find RxJS Difficult](but-rxjs-is-hard.md)
* [Writing Readable RxJS](writing-readable-rxjs.md)
