import { UnprocessableEntityException } from '@nestjs/common';

export default function HandleErros(errors) {
  const result = errors.map((error) => {
    const errorMessage: { [key: string]: unknown[] } = {} as any;
    if (error.children?.length) {
      for (const child of error.children) {
        if (child.children?.length) {
          for (const subChild of child.children) {
            errorMessage[subChild.property] = [];
            Object.values(subChild.constraints!).forEach((message) => {
              errorMessage[subChild.property].push(message);
            });
          }
        } else {
          errorMessage[child.property] = [];
          Object.values(child.constraints!).forEach((message) => {
            errorMessage[child.property].push(message);
          });
        }
      }
    }
    if (error.constraints) {
      errorMessage[error.property] = [];
      Object.values(error.constraints!).forEach((message) => {
        errorMessage[error.property].push(message);
      });
    }
    return errorMessage;
  });
  return new UnprocessableEntityException(result);
}
