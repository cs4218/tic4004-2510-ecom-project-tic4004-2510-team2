import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userModel from '../models/userModel.js';
import { forgotPasswordController } from './authController.js';
import { hashPassword, comparePassword } from '../helpers/authHelper.js';

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
