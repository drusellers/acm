To make working together easier I'd like to suggest that we set up cross AWS Account trust. This will let me authenticate to my AWS Account using my Google SSO. Once authenticated to AWS, I will then be able to "switch roles" to your AWS account(s) where your team will be able to apply a fine grain of control over my access. This is an amazing feature of AWS that I use when assisting teams with their AWS setup.

https://repost.aws/knowledge-center/cross-account-access-iam

It makes it very clear through the role who is accessing your AWS accounts, and what permissions they have.

The basic process is detailed below with CloudFormation templates to help ease the work.

## Target AWS Account 

Step One: Create the Role that I will assume, along with setting the role's permissions (via policies).

The benefit here is that you don't have to manage and share my password, and instead trust my AWS account. Once I SSO into my AWS Account, I can switch roles into your account with the permissions you have defined. The AWS Account `550846617829` is my bastion account for jumping into other AWS accounts.

At the end of the contract you can remove this role, and your cleanup is done.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  CuriousMindRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: acuriousmind-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: arn:aws:iam::550846617829:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_d777221244d1e70c
            Action: sts:AssumeRole
      Description: "Allows users from 550846617829 to assume this role"
 
  CloudWatchDashboardPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: CloudWatchDashboardWritePolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - cloudwatch:PutDashboard
            Resource: "*"
      Roles:
        - !Ref CuriousMindRole

  ReadOnlyAccessAttachment:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: ReadOnlyAccessPolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action: "*"
            Resource: "*"
      Roles:
        - !Ref CuriousMindRole

```

## A Curious Mind

Step 2: With that work done, you'll have a role ARN that you can send me, I'll add that to my own CloudFormation script, and then I'll be able to switch roles over to the Lee accounts.

No secrets have to be shared!!

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  CrossAccountIAMPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: AssumeAcuriousmindRole
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action: sts:AssumeRole
            Resource: arn:aws:iam::[LEE ACCOUNT]:role/acuriousmind-role
      Roles:
        - aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_d777221244d1e70c
```