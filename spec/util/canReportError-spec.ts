import { expect } from 'chai';
import { noop, Subject } from 'rxjs';
import { canReportError } from 'rxjs/internal/util/canReportError';
import { SafeSubscriber } from 'rxjs/internal/Subscriber';

describe('canReportError', () => {
  it('should report errors to an observer if possible', () => {
    const subscriber = new SafeSubscriber<{}>(noop, noop);
    expect(canReportError(subscriber)).to.be.true;
  });

  it('should not report errors to a stopped observer', () => {
    const subscriber = new SafeSubscriber<{}>(noop, noop);
    subscriber.error(new Error('kaboom'));
    expect(canReportError(subscriber)).to.be.false;
  });

  it('should not report errors to a closed subject', () => {
    const subject = new Subject<{}>();
    subject.unsubscribe();
    expect(canReportError(subject)).to.be.false;
  });

  it('should not report errors an observer with a stopped destination', () => {
    const destination = new SafeSubscriber<{}>(noop, noop);
    const subscriber = new SafeSubscriber<{}>(destination);
    destination.error(new Error('kaboom'));
    expect(canReportError(subscriber)).to.be.false;
  });
});
