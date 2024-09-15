import { Request } from 'express';
import { extractTokenFromHeader } from './extract-token.util';

describe('extractTokenFromHeader', () => {
  it('should extract a valid Bearer token', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer validToken123',
      },
    } as Request;

    expect(extractTokenFromHeader(mockRequest)).toBe('validToken123');
  });

  it('should return undefined for a non-Bearer token', () => {
    const mockRequest = {
      headers: {
        authorization: 'Basic someOtherToken',
      },
    } as Request;

    expect(extractTokenFromHeader(mockRequest)).toBeUndefined();
  });

  it('should return undefined when authorization header is missing', () => {
    const mockRequest = {
      headers: {},
    } as Request;

    expect(extractTokenFromHeader(mockRequest)).toBeUndefined();
  });

  it('should return undefined when authorization header is empty', () => {
    const mockRequest = {
      headers: {
        authorization: '',
      },
    } as Request;

    expect(extractTokenFromHeader(mockRequest)).toBeUndefined();
  });

  it('should return undefined when authorization header has incorrect format', () => {
    const mockRequest = {
      headers: {
        authorization: 'BearerInvalidFormat',
      },
    } as Request;

    expect(extractTokenFromHeader(mockRequest)).toBeUndefined();
  });

  it('should return undefined when token is empty', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer ',
      },
    } as Request;

    expect(extractTokenFromHeader(mockRequest)).toBeUndefined();
  });
});
