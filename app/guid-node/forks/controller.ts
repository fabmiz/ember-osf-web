import Controller from '@ember/controller';
import { action, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Analytics from 'ember-osf-web/services/analytics';

import Intl from 'ember-intl/services/intl';
import Node from 'ember-osf-web/models/node';
import StatusMessages from 'ember-osf-web/services/status-messages';
import Toast from 'ember-toastr/services/toast';

import currentUser from 'ember-osf-web/services/current-user';

export default class GuidNodeForks extends Controller {
    @service toast!: Toast;
    @service intl!: Intl;
    @service statusMessages!: StatusMessages;
    @service analytics!: Analytics;
    @service currentUser!: currentUser;

    toDelete: Node | null = null;
    deleteModal = false;
    loadingNew = false;
    newModal = false;

    reloadList?: (page?: number) => void; // bound by paginated-list

    forksQueryParams = { embed: 'bibliographic_contributors' };

    @reads('model.taskInstance.value')
    node?: Node;

    @computed('node.parent')
    get nodeType() {
        if (!this.node) {
            return undefined;
        }
        return this.node.parent ? 'component' : 'project';
    }

    @action
    openDeleteModal(node: Node) {
        node.get('children').then(children => {
            if (children.toArray().length) {
                const message = this.intl.t('forks.unable_to_delete_fork');
                this.toast.error(message);
            } else {
                this.set('toDelete', node);
                this.set('deleteModal', true);
            }
        });
    }

    @action
    closeDeleteModal() {
        this.set('toDelete', null);
        this.set('deleteModal', false);
    }

    @action
    newFork() {
        this.set('newModal', false);
        this.set('loadingNew', true);
        this.node!.makeFork().then(() => {
            this.set('loadingNew', false);
            const message = this.intl.t('forks.new_fork_info');
            const title = this.intl.t('forks.new_fork_info_title');
            this.toast.info(message, title, {
                timeOut: 0,
                extendedTimeOut: 0,
            });
            if (this.reloadList) {
                this.reloadList();
            }
        }).catch(() => {
            this.set('loadingNew', false);
            this.toast.error(this.intl.t('forks.new_fork_failed'));
        });
    }

    @action
    delete() {
        this.set('deleteModal', false);
        const node = this.toDelete;
        if (!node) {
            return;
        }
        this.set('toDelete', null);
        node.deleteRecord();
        node.save().then(() => {
            this.toast.success(this.intl.t('status.project_deleted'));
            if (this.reloadList) {
                this.reloadList();
            }
        }).catch(() => {
            this.toast.error(this.intl.t('forks.delete_fork_failed'));
        });
    }
}

declare module '@ember/controller' {
  interface Registry {
    'guid-node/forks': GuidNodeForks;
  }
}
