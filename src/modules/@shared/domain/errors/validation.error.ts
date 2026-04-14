import { FieldsErrors } from '../entity/validators/validator-fields-interface';

const DEFAULT_MESSAGE =
  'The request could not be processed with the provided parameters';

export abstract class BaseValidationError extends Error {
  public status = 422;

  constructor(
    public error: FieldsErrors[],
    message = DEFAULT_MESSAGE,
  ) {
    super(message);
    this.name = 'BaseValidationError';
  }

  count(): number {
    return this.error.length;
  }
}

export class EntityValidationError extends BaseValidationError {
  constructor(error: FieldsErrors[]) {
    super(error);
    this.name = 'EntityValidationError';
  }
}

export class SearchValidationError extends BaseValidationError {
  constructor(error: FieldsErrors[]) {
    super(error);
    this.name = 'SearchValidationError';
  }
}

export class LoadEntityError extends BaseValidationError {
  constructor(error: FieldsErrors[]) {
    super(error);
    this.name = 'LoadEntityError';
  }
}
