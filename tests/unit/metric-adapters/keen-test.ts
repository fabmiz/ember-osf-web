import Service from '@ember/service';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';
import { module, test } from 'qunit';

import KeenAdapter from 'ember-osf-web/metrics-adapters/keen';

module('Unit | Metrics Adapter | keen ', hooks => {
    setupTest(hooks);
    setupMirage(hooks);

    test('it exists', function(assert) {
        assert.ok(this.owner.lookup('metrics-adapter:keen') instanceof KeenAdapter);
    });

    sinonTest('trackPage - public node', async function(_) {
        const adapter = this.owner.lookup('metrics-adapter:keen') as KeenAdapter;
        const store = this.owner.lookup('service:store');

        const trackPublic = this.stub(adapter, 'trackPublicEvent');
        const trackPrivate = this.stub(adapter, 'trackPrivateEvent');

        const mirageNode = server.create('node', { public: true });
        const node = await store.findRecord('node', mirageNode.id);

        this.stub(adapter, 'getCurrentNode').resolves(node);

        await adapter.trackPage({ page: 'Foo', title: 'Bar' });

        this.sandbox.assert.called(trackPublic);
        this.sandbox.assert.called(trackPrivate);
    });

    sinonTest('trackPage - private node', async function(_) {
        const adapter = this.owner.lookup('metrics-adapter:keen') as KeenAdapter;
        const store = this.owner.lookup('service:store');

        const trackPublic = this.stub(adapter, 'trackPublicEvent');
        const trackPrivate = this.stub(adapter, 'trackPrivateEvent');

        const mirageNode = server.create('node', { public: false });
        const node = await store.findRecord('node', mirageNode.id);

        this.stub(adapter, 'getCurrentNode').resolves(node);

        await adapter.trackPage({ page: 'Foo', title: 'Bar' });

        this.sandbox.assert.called(trackPrivate);
        this.sandbox.assert.notCalled(trackPublic);
    });

    sinonTest('trackPage - no node', async function(_) {
        const adapter = this.owner.lookup('metrics-adapter:keen') as KeenAdapter;

        const trackPublic = this.stub(adapter, 'trackPublicEvent');
        const trackPrivate = this.stub(adapter, 'trackPrivateEvent');

        this.stub(adapter, 'getCurrentNode').resolves(undefined);

        await adapter.trackPage({ page: 'Foo', title: 'Bar' });

        this.sandbox.assert.called(trackPrivate);
        this.sandbox.assert.notCalled(trackPublic);
    });

    test('getCurrentModelTask - undefined', function(assert) {
        this.owner.register('route:foo', {}, { instantiate: false });
        this.owner.register('service:router', Service.extend({
            currentRouteName: 'foo',
        }));

        const adapter = this.owner.lookup('metrics-adapter:keen') as KeenAdapter;

        assert.equal(adapter.getCurrentModelTask(), undefined);
    });

    test('getCurrentModelTask - model', function(assert) {
        const taskInstance = { isRunning: true };

        this.owner.register('route:foo', { currentModel: { taskInstance } }, { instantiate: false });
        this.owner.register('route:foo.bar', { currentModel: { taskInstance: undefined } }, { instantiate: false });
        this.owner.register('service:router', Service.extend({
            currentRouteName: 'foo.bar',
        }));

        const adapter = this.owner.lookup('metrics-adapter:keen') as KeenAdapter;

        assert.equal(adapter.getCurrentModelTask(), taskInstance);
    });
});
