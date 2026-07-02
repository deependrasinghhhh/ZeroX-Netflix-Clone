import { PipeTransform, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { Schema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== "body") {
      return value;
    }
    try {
      return this.schema.parse(value);
    } catch (error: any) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Validation failed",
        errors: error.errors || error.message,
      });
    }
  }
}
