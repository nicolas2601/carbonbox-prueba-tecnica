import { Either } from "../../../shared/domain/Either";
import { InvalidActivityDataError } from "../errors/InvalidActivityDataError";

export interface ActivityDataProps {
  id: string;
  uploadId: string;
  category: string;
  amount: number;
  unit: string;
  date: Date;
}

export class ActivityData {
  private constructor(private readonly props: ActivityDataProps) {}
  static create(props: ActivityDataProps): Either<InvalidActivityDataError, ActivityData> {
    return Either.right(new ActivityData({ ...props, category: props.category.trim(), unit: props.unit.trim() }));
  }
  get id(): string { return this.props.id; }
  get uploadId(): string { return this.props.uploadId; }
  get category(): string { return this.props.category; }
  get amount(): number { return this.props.amount; }
  get unit(): string { return this.props.unit; }
  get date(): Date { return this.props.date; }
}
