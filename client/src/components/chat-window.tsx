import { Fragment } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

type Message = {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  read: boolean;
};

type Profile = {
  id: number;
  name: string;
  photos: Array<{ id: number; url: string; isMain: boolean }>;
};

type ChatWindowProps = {
  messages: Message[];
  currentUserId: number;
  matchProfile?: Profile;
};

export default function ChatWindow({ messages, currentUserId, matchProfile }: ChatWindowProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-lg font-semibold">No messages yet</p>
        <p className="text-muted-foreground mt-1">Send a message to start the conversation</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  // Get match profile photo
  const profilePhoto = matchProfile?.photos?.find(p => p.isMain)?.url || 
                      (matchProfile?.photos?.length > 0 ? matchProfile.photos[0].url : '');

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <Fragment key={date}>
          <div className="flex justify-center">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1 bg-background rounded-full">
              {format(new Date(date), "PPP")}
            </div>
          </div>
          
          <div className="space-y-4">
            {dateMessages.map(message => {
              const isSender = message.senderId === currentUserId;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isSender ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
                    {!isSender && (
                      <Avatar className="h-8 w-8">
                        {profilePhoto ? (
                          <AvatarImage src={profilePhoto} alt={matchProfile?.name} />
                        ) : (
                          <AvatarFallback>{matchProfile?.name?.charAt(0) ?? '?'}</AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    
                    <div 
                      className={`px-4 py-2 rounded-2xl ${
                        isSender 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-accent text-accent-foreground rounded-bl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div 
                        className={`text-xs mt-1 ${
                          isSender ? 'text-primary-foreground/70 text-right' : 'text-accent-foreground/70'
                        }`}
                      >
                        {format(new Date(message.createdAt), "p")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
