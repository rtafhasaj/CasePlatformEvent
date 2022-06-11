public with sharing class PublishCaseViewEvent {

    @AuraEnabled
    public static void publishCaseEvt() {
        String notification =  UserInfo.getName() +' started viewing this case. In order to use the time efficiently, please agree with you colleague who is currently working on this case.';
        
        Case_Record_Loaded__e event = new Case_Record_Loaded__e(
            Message_To_Dsiplay__c=notification,
            Current_User__c=UserInfo.getName()
        );
        
        Database.SaveResult result = EventBus.publish(event);
        if (!result.isSuccess()) {
            for (Database.Error error : result.getErrors()) {
                System.debug('Error returned: ' +
                                error.getStatusCode() +' - '+
                                error.getMessage());
            }
        }
    }
}