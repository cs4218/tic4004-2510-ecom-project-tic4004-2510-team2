import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userModel from '../models/userModel.js';
import { forgotPasswordController, loginController } from './authController.js';
import { hashPassword, comparePassword } from '../helpers/authHelper.js';
import jwt from 'jsonwebtoken';

describe('forgotPasswordController', () => {
  const getRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };
  const getReq = (body) => ({ body });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('when email is missing then should return status 400 with correct error message', async () => {
    const req = getReq({ answer: 'a1', newPassword: 'p1' });
    const res = getRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Email is required' });
  });

  it('when answer is missing then should return status 400 with correct error message', async () => {
    const req = getReq({ email: 'e@x.com', newPassword: 'p1' });
    const res = getRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'answer is required' });
  });

  it('when newPassword is missing then should return status 400 with correct error message', async () => {
    const req = getReq({ email: 'e@x.com', answer: 'a1' });
    const res = getRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'New Password is required' });
  });

  it('when user not found then should return 404 with correct error message', async () => {
    const req = getReq({ email: 'e@x.com', answer: 'a1', newPassword: 'p1' });
    const res = getRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'e@x.com', answer: 'a1' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Wrong Email Or Answer',
    });
  });

  it('when user found then should return 200 and update password', async () => {
    const req = getReq({ email: 'e@x.com', answer: 'a1', newPassword: 'p1' });
    const res = getRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({ _id: 'uid-123' });
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce({});
    jest.spyOn(console, 'log').mockImplementation(() => {}); // silence logs from controller

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'e@x.com', answer: 'a1' });

    const updateArgs = userModel.findByIdAndUpdate.mock.calls[0][1];
    const hashedPassword = updateArgs.password;

    const match = await comparePassword('p1', hashedPassword);
    expect(match).toBe(true);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Password Reset Successfully',
    });
  });

  it('when hashing fails then should return status 500 with correct error message', async () => {
    const req = getReq({ email: 'e@x.com', answer: 'a1', newPassword: 'p1' });
    const res = getRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({ _id: 'uid-123' });
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Something went wrong',
        })
    );
  });
});

/* Login Controller Tests */
describe('loginController unit tests', () => {
  const MockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // test case: email field is empty
  it('should return 404 if email empty', async () => {
    const req = { body: { email: '', password: 'password123' } };
    const res = MockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Invalid email or password',
      success: false,
     });
  });

  // test case: password field is empty
  it('should return 404 if password empty', async () => {
    const req = { body: { email: 'user@example.com', password: '' } };
    const res = MockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Invalid email or password',
      success: false,
     });
  });

  // test case: email not registered
  it('should return 404 if email not registered', async () => {
    jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
    const req = { body: { email: 'user@example.com', password: 'password123' } };
    const res = MockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Email is not registerd',
      success: false
     });
  });

  // test case: correct email but wrong password
  it('should return 200 if password does not match', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'user@example.com', password: hashedPassword });
    const req = { body: { email: 'user@example.com', password: 'wrongPassword' } };
    const res = MockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Invalid Password',
      success: false
    });
  });

  // test case: invalid token
  it('should return 500 if token is invalid', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'user@example.com', password: hashedPassword });
    jest.spyOn(jwt, 'sign').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = { body: { email: 'user@example.com', password: 'correctPassword' } };
    const res = MockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Error in login',
      success: false,
      error: new Error('Invalid token'),
    });
  });

  // test case: successful login
  it('should return 200 and token on successful login', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ 
      _id: '1', 
      name: 'Test User',
      email: 'user@example.com', 
      password: hashedPassword,
      phone: '12345678',
      address: '123 Test St',
      role: 0,
    });
    jest.spyOn(jwt, 'sign').mockReturnValue('mocktoken');
    const req = { body: { email: 'user@example.com', password: 'correctPassword' } };
    const res = MockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'login successfully',
        token: 'mocktoken',
        user: expect.objectContaining({
          _id: '1', 
          name: 'Test User',
          email: 'user@example.com',
          phone: '12345678',
          address: '123 Test St',
          role: 0
        })
      })
    );
  });

});
