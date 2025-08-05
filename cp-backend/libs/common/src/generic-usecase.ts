/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UseCase
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

/**
 * The UseCase class is a generic abstract class with Input and Output type parameters for creating usecase classes
 */
export abstract class UseCase<Input, Output> {
  abstract execute(input: Input): Promise<Output> | Output;
}
