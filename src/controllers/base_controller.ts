import { Request, Response } from "express";
import { Model } from "mongoose";
import userModel from "../models/user_model";

class BaseController<T> {
  model: Model<T>;
  constructor(model: Model<T>) {
    this.model = model;
  }

  async getAllItems(req: Request, res: Response) {
    const items = await this.model.find();
    res.status(200).send(items);
  }

  async getItemById(req: Request, res: Response) {
    const id = req.params.id;
    if (id) {
      try {
        const item = await this.model.findById(id);
        if (item) {
          res.status(200).send(item);
        } else {
          res.status(404).send("Item not found");
        }
      } catch (error) {
        res.status(400).send(error);
      }
    }
  }

  async getItemBySender(req: Request, res: Response) {
    const sender = req.query.sender;
    if (sender) {
      try {
        const items = await this.model.find({ sender: sender });
        if (items) {
          res.status(200).send(items);
        } else {
          res.status(404).send("Item not found");
        }
      } catch (error) {
        res.status(400).send(error);
      }
    } else {
      res.status(400).send("Sender is required");
    }
  }

  async createItem(req: Request, res: Response) {
    const body = req.body;

    if (body) {
      try {
        const item = await this.model.create({...body, sender: req.params.username, senderId: req.params.userId});
        res.status(201).send(item);
      } catch (error) {
        res.status(400).send(error);
      }
    } else {
      res.status(400).send("User or Post does not exist");
    }
  }

  async deleteItem(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const item = await this.model.findByIdAndDelete(id);
      if (item) {
        res.status(200).send("Item deleted");
      } else {
        res.status(404).send("Item not found");
      }
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("An unknown error occurred");
      }
    }
  }

  async updateItem(req: Request, res: Response) {
    const id = req.params.id;
    const body = req.body;
    
    try{
      const userExists = await userModel.find({ username: req.params.username });
      if (body && userExists.length == 1) {
        const item = await this.model.findByIdAndUpdate(id, body, {
          new: true,
        });
        if (!item) {
          return res.status(404).send("Item not found");
        }
        res.status(200).send(item);
      } else {
        res.status(400).send("Item is required or User does not exist");
      }
    }catch (error) {
        res.status(404).send("Item does not exist: " + error);
    }
  }
}

export default BaseController;
