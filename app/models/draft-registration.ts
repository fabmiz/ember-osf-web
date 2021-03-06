import { attr, belongsTo, hasMany, AsyncBelongsTo, AsyncHasMany } from '@ember-data/model';

import { RegistrationResponse } from 'ember-osf-web/packages/registration-schema';

import DraftNodeModel from 'ember-osf-web/models/draft-node';
import ContributorModel from './contributor';
import InstitutionModel from './institution';
import LicenseModel from './license';
import NodeModel, { NodeCategory, NodeLicense } from './node';
import OsfModel, { Permission } from './osf-model';
import RegistrationProviderModel from './registration-provider';
import RegistrationSchemaModel, { RegistrationMetadata } from './registration-schema';
import SubjectModel from './subject';
import UserModel from './user';

export enum DraftMetadataProperties {
    Title = 'title',
    Description = 'description',
    Category = 'category',
    AffiliatedInstitutions = 'affiliatedInstitutions',
    License = 'license',
    NodeLicenseProperty = 'nodeLicense',
    Subjects = 'subjects',
    Tags = 'tags',
}

export default class DraftRegistrationModel extends OsfModel {
    @attr('fixstring') registrationSupplement!: string;
    @attr('object') registrationMetadata!: RegistrationMetadata;
    @attr('registration-responses') registrationResponses!: RegistrationResponse;
    @attr('date') datetimeInitiated!: Date;
    @attr('date') datetimeUpdated!: Date;

    @attr('fixstring') title!: string;
    @attr('fixstring') description!: string;
    @attr('fixstringarray') tags!: string[];
    @attr('array') currentUserPermissions!: Permission[];
    @attr('node-license') nodeLicense!: NodeLicense | null;
    @attr('node-category') category!: NodeCategory;
    @attr('boolean') hasProject!: boolean;

    @belongsTo('abstract-node', { inverse: 'draftRegistrations', polymorphic: true })
    branchedFrom!: AsyncBelongsTo<NodeModel> & NodeModel
        | (AsyncBelongsTo<DraftNodeModel> & DraftNodeModel);

    @belongsTo('user', { inverse: null })
    initiator!: AsyncBelongsTo<UserModel> & UserModel;

    @belongsTo('registration-schema', { inverse: null })
    registrationSchema!: AsyncBelongsTo<RegistrationSchemaModel> & RegistrationSchemaModel;

    @belongsTo('registration-provider', { inverse: null })
    provider!: AsyncBelongsTo<RegistrationProviderModel> & RegistrationProviderModel;

    @hasMany('institution', { inverse: null, async: true })
    affiliatedInstitutions!: AsyncHasMany<InstitutionModel>;

    @hasMany('subject', { inverse: null, async: true })
    subjects!: AsyncHasMany<SubjectModel> | SubjectModel[];

    @belongsTo('license', { inverse: null, async: true })
    license!: AsyncBelongsTo<LicenseModel> & LicenseModel;

    @hasMany('contributor')
    contributors!: AsyncHasMany<ContributorModel> & ContributorModel[];

    @hasMany('contributor')
    bibliographicContributors!: AsyncHasMany<ContributorModel> & ContributorModel[];

    get currentUserIsAdmin() {
        return Array.isArray(this.currentUserPermissions) && this.currentUserPermissions.includes(Permission.Admin);
    }

    get currentUserIsReadOnly() {
        return Array.isArray(this.currentUserPermissions) && this.currentUserPermissions.includes(Permission.Read)
            && this.currentUserPermissions.length === 1;
    }
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        'draft-registration': DraftRegistrationModel;
    } // eslint-disable-line semi
}
